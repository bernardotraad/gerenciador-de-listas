"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type User } from "@/lib/supabase"
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/constants"
import { Users, Edit, Shield, UserCheck, Search, Plus, AlertTriangle, UserCog, Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [transferToUser, setTransferToUser] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (currentUser && !permissions.canManageUsers) {
      router.replace("/dashboard")
    }
  }, [currentUser, permissions.canManageUsers, router])

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
  }

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser || !currentUser) return

    const formData = new FormData(e.currentTarget)
    const updatedData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "admin" | "user" | "portaria",
    }

    // Validação: não permitir que o admin remova seu próprio acesso
    if (editingUser.id === currentUser.id && updatedData.role !== "admin") {
      toast.error("Você não pode remover seu próprio acesso de administrador")
      return
    }

    try {
      const { error } = await supabase.from("users").update(updatedData).eq("id", editingUser.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: currentUser.id,
          action: "Usuário editado",
          details: `Usuário "${updatedData.name}" foi editado. Role: ${ROLE_LABELS[updatedData.role]}`,
        },
      ])

      toast.success("Usuário atualizado com sucesso!")
      setDialogOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast.error("Erro ao atualizar usuário")
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentUser) return

    setCreatingUser(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as "admin" | "user" | "portaria",
    }

    // validações simples
    if (payload.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      setCreatingUser(false)
      return
    }

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar usuário")
        setCreatingUser(false)
        return
      }

      toast.success(`Usuário criado com sucesso! Email: ${payload.email}`)
      setCreateDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Erro inesperado ao criar usuário:", error)
      toast.error("Erro inesperado ao criar usuário")
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!currentUser || !userToDelete) return

    // Validação: não permitir que o admin delete a si mesmo
    if (userToDelete.id === currentUser.id) {
      toast.error("Você não pode deletar sua própria conta")
      return
    }

    try {
      // Se foi selecionado um usuário para transferir, fazer a transferência primeiro
      if (transferToUser) {
        // Transferir eventos
        await supabase.from("events").update({ created_by: transferToUser }).eq("created_by", userToDelete.id)

        // Transferir listas de convidados
        await supabase.from("guest_lists").update({ submitted_by: transferToUser }).eq("submitted_by", userToDelete.id)
      } else {
        // Se não transferir, deletar registros relacionados
        await supabase.from("activity_logs").delete().eq("user_id", userToDelete.id)
        await supabase.from("guest_lists").delete().eq("submitted_by", userToDelete.id)
        await supabase.from("events").delete().eq("created_by", userToDelete.id)
      }

      // Deletar da tabela users primeiro
      const { error: dbError } = await supabase.from("users").delete().eq("id", userToDelete.id)

      if (dbError) throw dbError

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: currentUser.id,
          action: "Usuário deletado",
          details: `Usuário "${userToDelete.name}" foi deletado${transferToUser ? " com transferência de dados" : ""}`,
        },
      ])

      toast.success("Usuário deletado com sucesso!")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setTransferToUser("")
      fetchUsers()
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      toast.error("Erro inesperado ao deletar usuário")
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  if (!permissions.canManageUsers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando usuários..." />
  }

  const adminCount = users.filter((u) => u.role === "admin").length
  const userCount = users.filter((u) => u.role === "user").length
  const portariaCount = users.filter((u) => u.role === "portaria").length
  const otherAdmins = users.filter((u) => u.role === "admin" && u.id !== userToDelete?.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema. Uma conta completa será criada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome Completo</Label>
                <Input id="create-name" name="name" placeholder="João Silva" className="h-12 text-base" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  placeholder="joao@email.com"
                  className="h-12 text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">Este será o email de login do usuário</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 text-base pr-20"
                    minLength={6}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const passwordField = document.getElementById("create-password") as HTMLInputElement
                        const newPassword = generateRandomPassword()
                        passwordField.value = newPassword
                        setShowPassword(true)
                        navigator.clipboard.writeText(newPassword)
                        toast.success("Senha gerada e copiada!")
                      }}
                    >
                      Gerar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use o botão "Gerar" para criar uma senha segura automaticamente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Cargo</Label>
                <Select name="role" defaultValue="user" required>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.user}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.user}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="portaria">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.portaria}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.portaria}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.admin}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.admin}</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Importante:</strong> O usuário poderá fazer login imediatamente com o email e senha
                  fornecidos.
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Criando usuário...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">acesso completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portaria</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portariaCount}</div>
            <p className="text-xs text-muted-foreground">nomes e check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Comuns</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">apenas envio de nomes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Gerencie todos os usuários do sistema</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {user.role === "admin" && <Shield className="w-4 h-4 text-blue-600" />}
                      {user.role === "portaria" && <UserCog className="w-4 h-4 text-purple-600" />}
                      <span>{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Você</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "portaria"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[user.role]}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={dialogOpen && editingUser?.id === user.id}
                        onOpenChange={(open) => {
                          setDialogOpen(open)
                          if (!open) setEditingUser(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>Altere as informações do usuário</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Nome</Label>
                              <Input id="edit-name" name="name" defaultValue={user.name} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input id="edit-email" name="email" type="email" defaultValue={user.email} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">Cargo</Label>
                              <Select name="role" defaultValue={user.role} required>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">
                                    <div>
                                      <div className="font-medium">{ROLE_LABELS.user}</div>
                                      <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.user}</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="portaria">
                                    <div>
                                      <div className="font-medium">{ROLE_LABELS.portaria}</div>
                                      <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.portaria}</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin">
                                    <div>
                                      <div className="font-medium">{ROLE_LABELS.admin}</div>
                                      <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.admin}</div>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {user.id === currentUser?.id && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ Você não pode remover seu próprio acesso de administrador
                                </p>
                              </div>
                            )}
                            <Button type="submit" className="w-full">
                              Salvar Alterações
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {user.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => openDeleteDialog(user)}
                        >
                          Deletar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">Não há usuários para os filtros selecionados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>

            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário "{userToDelete?.name}"?
            </AlertDialogDescription>

            <div className="space-y-3 mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Este usuário pode ter eventos, listas de convidados e logs associados.
                </p>
              </div>

              {otherAdmins.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="transfer-to">Transferir dados para outro administrador (opcional):</Label>
                  <Select value={transferToUser} onValueChange={setTransferToUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um administrador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não transferir (deletar dados)</SelectItem>
                      {otherAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Se não transferir, todos os dados relacionados serão deletados permanentemente.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
                setTransferToUser("")
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Deletar Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
