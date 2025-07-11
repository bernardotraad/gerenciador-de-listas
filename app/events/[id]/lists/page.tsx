"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type Event, type EventList, type ListType, type Sector } from "@/lib/supabase"
import { Plus, List, Users, Eye, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function EventListsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [listTypes, setListTypes] = useState<ListType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<EventList | null>(null)

  useEffect(() => {
    if (!permissions.canViewEvents) {
      router.replace("/dashboard")
      return
    }
    fetchData()
  }, [eventId, permissions.canViewEvents, router])

  const fetchData = async () => {
    try {
      // Buscar evento
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Buscar listas do evento com contadores
      const { data: listsData, error: listsError } = await supabase
        .from("event_lists")
        .select(`
          *,
          list_types (name, color),
          sectors (name, color),
          users (name)
        `)
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (listsError) throw listsError

      // Buscar contadores para cada lista
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count: totalGuests } = await supabase
            .from("guest_lists")
            .select("*", { count: "exact", head: true })
            .eq("event_list_id", list.id)

          const { count: checkedIn } = await supabase
            .from("guest_lists")
            .select("*", { count: "exact", head: true })
            .eq("event_list_id", list.id)
            .eq("checked_in", true)

          return {
            ...list,
            _count: {
              guest_lists: totalGuests || 0,
              checked_in: checkedIn || 0,
            },
          }
        }),
      )

      setEventLists(listsWithCounts)

      // Buscar tipos de lista
      const { data: typesData, error: typesError } = await supabase
        .from("list_types")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (typesError) throw typesError
      setListTypes(typesData || [])

      // Buscar setores
      const { data: sectorsData, error: sectorsError } = await supabase
        .from("sectors")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (sectorsError) throw sectorsError
      setSectors(sectorsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleEditList = (list: EventList) => {
    setSelectedList(list)
    setEditDialogOpen(true)
  }

  const handleDeleteList = (list: EventList) => {
    setSelectedList(list)
    setDeleteDialogOpen(true)
  }

  const handleUpdateList = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !event || !selectedList) return

    const formData = new FormData(e.currentTarget)
    const listData = {
      list_type_id: formData.get("list_type_id") as string,
      sector_id: formData.get("sector_id") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      max_capacity: formData.get("max_capacity") ? Number.parseInt(formData.get("max_capacity") as string) : null,
    }

    try {
      const { error } = await supabase.from("event_lists").update(listData).eq("id", selectedList.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          event_id: eventId,
          action: "Lista editada",
          details: `Lista "${listData.name}" foi editada no evento "${event.name}"`,
        },
      ])

      toast.success("Lista atualizada com sucesso!")
      setEditDialogOpen(false)
      setSelectedList(null)
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar lista:", error)
      toast.error("Erro ao atualizar lista")
    }
  }

  const handleConfirmDelete = async () => {
    if (!user || !event || !selectedList) return

    try {
      // Verificar se há convidados na lista
      const { count } = await supabase
        .from("guest_lists")
        .select("*", { count: "exact", head: true })
        .eq("event_list_id", selectedList.id)

      if (count && count > 0) {
        toast.error(`Não é possível excluir a lista "${selectedList.name}" pois ela possui ${count} convidado(s).`)
        return
      }

      // Desativar a lista ao invés de excluir
      const { error } = await supabase.from("event_lists").update({ is_active: false }).eq("id", selectedList.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          event_id: eventId,
          action: "Lista removida",
          details: `Lista "${selectedList.name}" foi removida do evento "${event.name}"`,
        },
      ])

      toast.success("Lista removida com sucesso!")
      setDeleteDialogOpen(false)
      setSelectedList(null)
      fetchData()
    } catch (error) {
      console.error("Erro ao remover lista:", error)
      toast.error("Erro ao remover lista")
    }
  }

  const handleCreateList = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !event) return

    const formData = new FormData(e.currentTarget)
    const listData = {
      event_id: eventId,
      list_type_id: formData.get("list_type_id") as string,
      sector_id: formData.get("sector_id") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      max_capacity: formData.get("max_capacity") ? Number.parseInt(formData.get("max_capacity") as string) : null,
      created_by: user.id,
    }

    try {
      const { error } = await supabase.from("event_lists").insert([listData])

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          event_id: eventId,
          action: "Lista criada",
          details: `Lista "${listData.name}" criada para o evento "${event.name}"`,
        },
      ])

      toast.success("Lista criada com sucesso!")
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Erro ao criar lista:", error)
      toast.error("Erro ao criar lista")
    }
  }

  if (!permissions.canViewEvents) {
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
    return <Loading text="Carregando listas do evento..." />
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
          <Link href="/events">
            <Button>Voltar para Eventos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalGuests = eventLists.reduce((sum, list) => sum + (list._count?.guest_lists || 0), 0)
  const totalCheckedIn = eventLists.reduce((sum, list) => sum + (list._count?.checked_in || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.name, href: `/events/${event.id}` },
          { label: "Listas" },
        ]}
      />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Listas do Evento</h1>
          <p className="text-muted-foreground">
            <span className="font-medium">{event.name}</span> • {new Date(event.date).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {permissions.canManageEvents && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Lista</DialogTitle>
                <DialogDescription>Configure uma nova lista para este evento</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Lista</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: VIP Camarote A, Desconto Pista..."
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="list_type_id">Tipo de Lista</Label>
                    <Select name="list_type_id" required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {listTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sector_id">Setor</Label>
                    <Select name="sector_id" required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                              <span>{sector.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrição adicional da lista..."
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Capacidade Máxima (Opcional)</Label>
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    placeholder="Ex: 50"
                    className="h-12 text-base"
                  />
                </div>

                <Button type="submit" className="w-full h-12">
                  Criar Lista
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventLists.length}</div>
            <p className="text-xs text-muted-foreground">listas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">nomes enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckedIn}</div>
            <p className="text-xs text-muted-foreground">confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">dos convidados</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de listas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventLists.map((list) => (
          <Card key={list.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.list_types?.color }} />
                  <span className="text-lg">{list.name}</span>
                </div>
                {permissions.canManageEvents && (
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditList(list)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteList(list)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Tipo:</span>
                  <span>{list.list_types?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.sectors?.color }} />
                  <span className="font-medium">Setor:</span>
                  <span>{list.sectors?.name}</span>
                </div>
                {list.description && <p className="text-sm">{list.description}</p>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{list._count?.guest_lists || 0}</div>
                    <div className="text-xs text-muted-foreground">Convidados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{list._count?.checked_in || 0}</div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                </div>

                {list.max_capacity && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ocupação</span>
                      <span>
                        {list._count?.guest_lists || 0}/{list.max_capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((list._count?.guest_lists || 0) / list.max_capacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Link href={`/events/${eventId}/lists/${list.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Lista
                    </Button>
                  </Link>
                  <Link href={`/events/${eventId}/lists/${list.id}/send`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {eventLists.length === 0 && (
        <div className="text-center py-12">
          <List className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma lista criada</h3>
          <p className="text-muted-foreground mb-4">
            {permissions.canManageEvents
              ? "Crie a primeira lista para este evento."
              : "Não há listas disponíveis para este evento."}
          </p>
          {permissions.canManageEvents && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Lista
            </Button>
          )}
        </div>
      )}

      {/* Dialog de Edição */}
      {permissions.canManageEvents && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="mx-4 max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Lista</DialogTitle>
              <DialogDescription>Modifique as informações da lista</DialogDescription>
            </DialogHeader>
            {selectedList && (
              <form onSubmit={handleUpdateList} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome da Lista</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedList.name}
                    placeholder="Ex: VIP Camarote A, Desconto Pista..."
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-list_type_id">Tipo de Lista</Label>
                    <Select name="list_type_id" defaultValue={selectedList.list_type_id} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {listTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-sector_id">Setor</Label>
                    <Select name="sector_id" defaultValue={selectedList.sector_id} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                              <span>{sector.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrição (Opcional)</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={selectedList.description || ""}
                    placeholder="Descrição adicional da lista..."
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-max_capacity">Capacidade Máxima (Opcional)</Label>
                  <Input
                    id="edit-max_capacity"
                    name="max_capacity"
                    type="number"
                    defaultValue={selectedList.max_capacity || ""}
                    placeholder="Ex: 50"
                    className="h-12 text-base"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {permissions.canManageEvents && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Remoção</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. A lista será desativada e não aparecerá mais no sistema.
              </DialogDescription>
            </DialogHeader>
            {selectedList && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Lista a ser removida:</h4>
                  <p className="text-red-700">
                    <strong>{selectedList.name}</strong>
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Tipo: {selectedList.list_types?.name} • Setor: {selectedList.sectors?.name}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" className="flex-1" onClick={handleConfirmDelete}>
                    Confirmar Remoção
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
