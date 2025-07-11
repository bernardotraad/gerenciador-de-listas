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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type ListType, type Sector } from "@/lib/supabase"
import { Plus, Palette, MapPin, Edit, Trash2, Power, PowerOff } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ListTypesManagementPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [listTypes, setListTypes] = useState<ListType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ListType | null>(null)
  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: "list-type" | "sector"; item: ListType | Sector } | null>(
    null,
  )

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && !permissions.canManageUsers) {
      router.replace("/dashboard")
    }
  }, [user, permissions.canManageUsers, router])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar tipos de lista
      const { data: typesData, error: typesError } = await supabase
        .from("list_types")
        .select("*")
        .order("name", { ascending: true })

      if (typesError) throw typesError

      // Buscar setores
      const { data: sectorsData, error: sectorsError } = await supabase
        .from("sectors")
        .select("*")
        .order("name", { ascending: true })

      if (sectorsError) throw sectorsError

      setListTypes(typesData || [])
      setSectors(sectorsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const typeData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    }

    try {
      const { error } = await supabase.from("list_types").insert([typeData])

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Tipo de lista criado",
          details: `Tipo "${typeData.name}" foi criado`,
        },
      ])

      toast.success("Tipo de lista criado com sucesso!")
      setTypeDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Erro ao criar tipo:", error)
      toast.error("Erro ao criar tipo de lista")
    }
  }

  const handleUpdateType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !editingType) return

    const formData = new FormData(e.currentTarget)
    const typeData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    }

    try {
      const { error } = await supabase.from("list_types").update(typeData).eq("id", editingType.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Tipo de lista editado",
          details: `Tipo "${typeData.name}" foi editado`,
        },
      ])

      toast.success("Tipo de lista atualizado com sucesso!")
      setEditingType(null)
      setTypeDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar tipo:", error)
      toast.error("Erro ao atualizar tipo de lista")
    }
  }

  const handleCreateSector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const sectorData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      capacity: Number.parseInt(formData.get("capacity") as string),
      color: formData.get("color") as string,
    }

    try {
      const { error } = await supabase.from("sectors").insert([sectorData])

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Setor criado",
          details: `Setor "${sectorData.name}" foi criado`,
        },
      ])

      toast.success("Setor criado com sucesso!")
      setSectorDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Erro ao criar setor:", error)
      toast.error("Erro ao criar setor")
    }
  }

  const handleUpdateSector = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !editingSector) return

    const formData = new FormData(e.currentTarget)
    const sectorData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      capacity: Number.parseInt(formData.get("capacity") as string),
      color: formData.get("color") as string,
    }

    try {
      const { error } = await supabase.from("sectors").update(sectorData).eq("id", editingSector.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Setor editado",
          details: `Setor "${sectorData.name}" foi editado`,
        },
      ])

      toast.success("Setor atualizado com sucesso!")
      setEditingSector(null)
      setSectorDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar setor:", error)
      toast.error("Erro ao atualizar setor")
    }
  }

  const toggleTypeStatus = async (typeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("list_types").update({ is_active: !currentStatus }).eq("id", typeId)

      if (error) throw error

      const type = listTypes.find((t) => t.id === typeId)

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          action: `Tipo de lista ${!currentStatus ? "ativado" : "desativado"}`,
          details: `Tipo "${type?.name}" foi ${!currentStatus ? "ativado" : "desativado"}`,
        },
      ])

      toast.success(`Tipo ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      fetchData()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status")
    }
  }

  const toggleSectorStatus = async (sectorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("sectors").update({ is_active: !currentStatus }).eq("id", sectorId)

      if (error) throw error

      const sector = sectors.find((s) => s.id === sectorId)

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          action: `Setor ${!currentStatus ? "ativado" : "desativado"}`,
          details: `Setor "${sector?.name}" foi ${!currentStatus ? "ativado" : "desativado"}`,
        },
      ])

      toast.success(`Setor ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      fetchData()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status")
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete || !user) return

    try {
      if (itemToDelete.type === "list-type") {
        // Verificar se há listas usando este tipo
        const { count } = await supabase
          .from("event_lists")
          .select("*", { count: "exact", head: true })
          .eq("list_type_id", itemToDelete.item.id)

        if (count && count > 0) {
          toast.error(`Não é possível excluir. Há ${count} listas usando este tipo.`)
          setDeleteDialogOpen(false)
          setItemToDelete(null)
          return
        }

        const { error } = await supabase.from("list_types").delete().eq("id", itemToDelete.item.id)
        if (error) throw error

        // Log da atividade
        await supabase.from("activity_logs").insert([
          {
            user_id: user.id,
            action: "Tipo de lista excluído",
            details: `Tipo "${itemToDelete.item.name}" foi excluído`,
          },
        ])

        toast.success("Tipo de lista excluído com sucesso!")
      } else {
        // Verificar se há listas usando este setor
        const { count } = await supabase
          .from("event_lists")
          .select("*", { count: "exact", head: true })
          .eq("sector_id", itemToDelete.item.id)

        if (count && count > 0) {
          toast.error(`Não é possível excluir. Há ${count} listas usando este setor.`)
          setDeleteDialogOpen(false)
          setItemToDelete(null)
          return
        }

        const { error } = await supabase.from("sectors").delete().eq("id", itemToDelete.item.id)
        if (error) throw error

        // Log da atividade
        await supabase.from("activity_logs").insert([
          {
            user_id: user.id,
            action: "Setor excluído",
            details: `Setor "${itemToDelete.item.name}" foi excluído`,
          },
        ])

        toast.success("Setor excluído com sucesso!")
      }

      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchData()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast.error("Erro ao excluir item")
    }
  }

  const openEditTypeDialog = (type: ListType) => {
    setEditingType(type)
    setTypeDialogOpen(true)
  }

  const openEditSectorDialog = (sector: Sector) => {
    setEditingSector(sector)
    setSectorDialogOpen(true)
  }

  const openDeleteDialog = (type: "list-type" | "sector", item: ListType | Sector) => {
    setItemToDelete({ type, item })
    setDeleteDialogOpen(true)
  }

  const closeTypeDialog = () => {
    setTypeDialogOpen(false)
    setEditingType(null)
  }

  const closeSectorDialog = () => {
    setSectorDialogOpen(false)
    setEditingSector(null)
  }

  if (!permissions.canManageUsers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando configurações..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Tipos de Lista e Setores</h1>
        <p className="text-muted-foreground">Configure os tipos de lista e setores disponíveis para os eventos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tipos de Lista */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Tipos de Lista
              </div>
              <Dialog open={typeDialogOpen} onOpenChange={closeTypeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingType ? "Editar Tipo de Lista" : "Criar Novo Tipo de Lista"}</DialogTitle>
                    <DialogDescription>
                      {editingType
                        ? "Altere as informações do tipo de lista"
                        : "Configure um novo tipo de lista para os eventos"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingType ? handleUpdateType : handleCreateType} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type-name">Nome</Label>
                      <Input
                        id="type-name"
                        name="name"
                        placeholder="Ex: VIP, Desconto, Imprensa..."
                        defaultValue={editingType?.name || ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type-description">Descrição</Label>
                      <Textarea
                        id="type-description"
                        name="description"
                        placeholder="Descrição do tipo de lista..."
                        defaultValue={editingType?.description || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type-color">Cor</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="type-color"
                          name="color"
                          type="color"
                          defaultValue={editingType?.color || "#3B82F6"}
                          className="w-20 h-10"
                          required
                        />
                        <Input
                          placeholder="#3B82F6"
                          className="flex-1"
                          defaultValue={editingType?.color || ""}
                          onChange={(e) => {
                            const colorInput = document.getElementById("type-color") as HTMLInputElement
                            if (colorInput) colorInput.value = e.target.value
                          }}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingType ? "Salvar Alterações" : "Criar Tipo"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>Categorias para organizar as listas de convidados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
                        <div>
                          <div className="font-medium">{type.name}</div>
                          {type.description && <div className="text-sm text-muted-foreground">{type.description}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          type.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditTypeDialog(type)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTypeStatus(type.id, type.is_active)}
                          className={type.is_active ? "text-orange-600" : "text-green-600"}
                        >
                          {type.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog("list-type", type)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Setores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Setores
              </div>
              <Dialog open={sectorDialogOpen} onOpenChange={closeSectorDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Setor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSector ? "Editar Setor" : "Criar Novo Setor"}</DialogTitle>
                    <DialogDescription>
                      {editingSector ? "Altere as informações do setor" : "Configure um novo setor para os eventos"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingSector ? handleUpdateSector : handleCreateSector} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sector-name">Nome</Label>
                      <Input
                        id="sector-name"
                        name="name"
                        placeholder="Ex: Pista, Camarote A, VIP..."
                        defaultValue={editingSector?.name || ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector-description">Descrição</Label>
                      <Textarea
                        id="sector-description"
                        name="description"
                        placeholder="Descrição do setor..."
                        defaultValue={editingSector?.description || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector-capacity">Capacidade</Label>
                      <Input
                        id="sector-capacity"
                        name="capacity"
                        type="number"
                        placeholder="100"
                        defaultValue={editingSector?.capacity || 100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector-color">Cor</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="sector-color"
                          name="color"
                          type="color"
                          defaultValue={editingSector?.color || "#3B82F6"}
                          className="w-20 h-10"
                          required
                        />
                        <Input
                          placeholder="#3B82F6"
                          className="flex-1"
                          defaultValue={editingSector?.color || ""}
                          onChange={(e) => {
                            const colorInput = document.getElementById("sector-color") as HTMLInputElement
                            if (colorInput) colorInput.value = e.target.value
                          }}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingSector ? "Salvar Alterações" : "Criar Setor"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>Áreas físicas do evento para organizar os convidados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map((sector) => (
                  <TableRow key={sector.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sector.color }} />
                        <div>
                          <div className="font-medium">{sector.name}</div>
                          {sector.description && (
                            <div className="text-sm text-muted-foreground">{sector.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{sector.capacity}</span>
                      <span className="text-sm text-muted-foreground ml-1">pessoas</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sector.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sector.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditSectorDialog(sector)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSectorStatus(sector.id, sector.is_active)}
                          className={sector.is_active ? "text-orange-600" : "text-green-600"}
                        >
                          {sector.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog("sector", sector)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type === "list-type" ? "o tipo de lista" : "o setor"} "
              {itemToDelete?.item.name}"?
              <br />
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
