"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FileText, Plus, Edit, Trash2, Search, Palette } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ListType {
  id: string
  name: string
  description: string
  color: string
  is_active: boolean
  created_at: string
}

const ListTypesManagementPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [listTypes, setListTypes] = useState<ListType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedListType, setSelectedListType] = useState<ListType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    is_active: true,
  })

  const handleLoadListTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("list_types")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      setListTypes(data || [])
    } catch (error) {
      console.error("Erro ao carregar tipos de lista:", error)
      toast.error("Erro ao carregar tipos de lista")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateListType = async () => {
    try {
      const { error } = await supabase.from("list_types").insert([formData])

      if (error) throw error

      toast.success("Tipo de lista criado com sucesso!")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "", color: "#3b82f6", is_active: true })
      handleLoadListTypes()
    } catch (error: any) {
      console.error("Erro ao criar tipo de lista:", error)
      toast.error(error.message || "Erro ao criar tipo de lista")
    }
  }

  const handleUpdateListType = async () => {
    if (!selectedListType) return

    try {
      const { error } = await supabase
        .from("list_types")
        .update(formData)
        .eq("id", selectedListType.id)

      if (error) throw error

      toast.success("Tipo de lista atualizado com sucesso!")
      setIsEditDialogOpen(false)
      setSelectedListType(null)
      setFormData({ name: "", description: "", color: "#3b82f6", is_active: true })
      handleLoadListTypes()
    } catch (error: any) {
      console.error("Erro ao atualizar tipo de lista:", error)
      toast.error(error.message || "Erro ao atualizar tipo de lista")
    }
  }

  const handleDeleteListType = async (listType: ListType) => {
    try {
      const { error } = await supabase.from("list_types").delete().eq("id", listType.id)

      if (error) throw error

      toast.success("Tipo de lista excluído com sucesso!")
      handleLoadListTypes()
    } catch (error: any) {
      console.error("Erro ao excluir tipo de lista:", error)
      toast.error(error.message || "Erro ao excluir tipo de lista")
    }
  }

  const handleFilterListTypes = () => {
    return listTypes.filter((listType) =>
      listType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listType.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleOpenEditDialog = (listType: ListType) => {
    setSelectedListType(listType)
    setFormData({
      name: listType.name,
      description: listType.description,
      color: listType.color,
      is_active: listType.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (listType: ListType) => {
    setSelectedListType(listType)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  useEffect(() => {
    if (customUser) {
      handleLoadListTypes()
    }
  }, [customUser])

  if (!permissions.canManageListTypes) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para gerenciar tipos de lista.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando tipos de lista..." />
  }

  const filteredListTypes = handleFilterListTypes()

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Lista</h1>
          <p className="text-muted-foreground">Gerencie os tipos de lista do sistema</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Tipo de Lista</DialogTitle>
              <DialogDescription>Adicione um novo tipo de lista ao sistema</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: VIP, Desconto, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descrição do tipo de lista"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateListType}>Criar Tipo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Lista</CardTitle>
          <CardDescription>Lista de todos os tipos de lista configurados</CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tipos de lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredListTypes.map((listType) => (
              <div key={listType.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: listType.color }}
                    />
                    <div>
                      <h3 className="font-medium">{listType.name}</h3>
                      <p className="text-sm text-muted-foreground">{listType.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={listType.is_active ? "default" : "secondary"}>
                    {listType.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(listType)}
                    aria-label={`Editar tipo de lista ${listType.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(listType)}
                        aria-label={`Excluir tipo de lista ${listType.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o tipo de lista "{listType.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteListType(listType)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            {filteredListTypes.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum tipo de lista encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Lista</DialogTitle>
            <DialogDescription>Edite as informações do tipo de lista</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: VIP, Desconto, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição do tipo de lista"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
              <Label htmlFor="edit-is_active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateListType}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ListTypesManagementPage
