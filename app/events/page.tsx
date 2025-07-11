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
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type Event } from "@/lib/supabase"
import { Calendar, Clock, Users, Plus, Edit, Eye, List, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function EventsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  // Redirecionar se não tiver permissão para visualizar eventos
  useEffect(() => {
    if (user && !permissions.canViewEvents) {
      router.replace("/dashboard")
    }
  }, [user, permissions.canViewEvents, router])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
      toast.error("Erro ao carregar eventos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const eventData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      max_capacity: Number.parseInt(formData.get("max_capacity") as string),
      created_by: user.id,
    }

    try {
      const { error } = await supabase.from("events").insert([eventData])

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Evento criado",
          details: `Evento "${eventData.name}" foi criado`,
        },
      ])

      toast.success("Evento criado com sucesso!")
      setDialogOpen(false)
      fetchEvents()
    } catch (error) {
      console.error("Erro ao criar evento:", error)
      toast.error("Erro ao criar evento")
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !editingEvent) return

    const formData = new FormData(e.currentTarget)
    const eventData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      max_capacity: Number.parseInt(formData.get("max_capacity") as string),
      status: formData.get("status") as "active" | "inactive" | "finished",
    }

    try {
      const { error } = await supabase.from("events").update(eventData).eq("id", editingEvent.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          event_id: editingEvent.id,
          action: "Evento editado",
          details: `Evento "${eventData.name}" foi editado`,
        },
      ])

      toast.success("Evento atualizado com sucesso!")
      setEditDialogOpen(false)
      setEditingEvent(null)
      fetchEvents()
    } catch (error) {
      console.error("Erro ao atualizar evento:", error)
      toast.error("Erro ao atualizar evento")
    }
  }

  const handleDeleteEvent = async () => {
    if (!user || !deletingEvent) return

    try {
      // Verificar se há listas associadas ao evento
      const { count: listsCount } = await supabase
        .from("event_lists")
        .select("*", { count: "exact", head: true })
        .eq("event_id", deletingEvent.id)
        .eq("is_active", true)

      if (listsCount && listsCount > 0) {
        toast.error(
          `Não é possível excluir o evento "${deletingEvent.name}" pois ele possui ${listsCount} lista(s) ativa(s).`,
        )
        return
      }

      // Verificar se há convidados associados ao evento
      const { count: guestsCount } = await supabase
        .from("guest_lists")
        .select("*", { count: "exact", head: true })
        .eq("event_id", deletingEvent.id)

      if (guestsCount && guestsCount > 0) {
        toast.error(
          `Não é possível excluir o evento "${deletingEvent.name}" pois ele possui ${guestsCount} convidado(s).`,
        )
        return
      }

      const { error } = await supabase.from("events").delete().eq("id", deletingEvent.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Evento excluído",
          details: `Evento "${deletingEvent.name}" foi excluído`,
        },
      ])

      toast.success("Evento excluído com sucesso!")
      setDeleteDialogOpen(false)
      setDeletingEvent(null)
      fetchEvents()
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast.error("Erro ao excluir evento")
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
    return <Loading text="Carregando eventos..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            {permissions.canManageEvents ? "Gerencie os eventos da casa de show" : "Visualize os eventos disponíveis"}
          </p>
        </div>

        {permissions.canManageEvents && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto h-12">
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>Preencha as informações do evento</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input id="name" name="name" className="h-12 text-base" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" className="text-base" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" name="date" type="date" className="h-12 text-base" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input id="time" name="time" type="time" className="h-12 text-base" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Capacidade Máxima</Label>
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    defaultValue={100}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12">
                  Criar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                <span className="text-lg">{event.name}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs self-start md:self-auto ${
                    event.status === "active"
                      ? "bg-green-100 text-green-800"
                      : event.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {event.status === "active" ? "Ativo" : event.status === "inactive" ? "Inativo" : "Finalizado"}
                </span>
              </CardTitle>
              <CardDescription className="text-sm">{event.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  {event.date ? new Date(event.date).toLocaleDateString("pt-BR") : "Data não definida"}
                </div>
                {event.time && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    {event.time}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  Capacidade: {event.max_capacity} pessoas
                </div>
              </div>

              <div className="space-y-2">
                <Link href={`/events/${event.id}`} className="w-full block">
                  <Button size="sm" variant="default" className="w-full h-10">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/events/${event.id}/lists`} className="w-full">
                    <Button size="sm" variant="outline" className="w-full h-10 bg-transparent">
                      <List className="w-4 h-4 mr-2" />
                      Listas
                    </Button>
                  </Link>

                  {permissions.canManageEvents && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(event)
                        setEditDialogOpen(true)
                      }}
                      className="w-full h-10 bg-transparent"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>

                {permissions.canManageEvents && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDeletingEvent(event)
                      setDeleteDialogOpen(true)
                    }}
                    className="w-full h-10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Evento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground text-center px-4">
            {permissions.canManageEvents
              ? "Crie seu primeiro evento clicando no botão acima."
              : "Não há eventos disponíveis no momento."}
          </p>
        </div>
      )}

      {/* Dialog de Edição */}
      {permissions.canManageEvents && (
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setEditingEvent(null)
          }}
        >
          <DialogContent className="mx-4 max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Evento</DialogTitle>
              <DialogDescription>Altere as informações do evento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Evento</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingEvent?.name}
                  className="h-12 text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingEvent?.description || ""}
                  className="text-base"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Data</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={editingEvent?.date}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Horário</Label>
                  <Input
                    id="edit-time"
                    name="time"
                    type="time"
                    defaultValue={editingEvent?.time || ""}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max_capacity">Capacidade Máxima</Label>
                <Input
                  id="edit-max_capacity"
                  name="max_capacity"
                  type="number"
                  defaultValue={editingEvent?.max_capacity}
                  className="h-12 text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={editingEvent?.status} required>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-12">
                Salvar Alterações
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {permissions.canManageEvents && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O evento será permanentemente excluído do sistema.
              </DialogDescription>
            </DialogHeader>
            {deletingEvent && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Evento a ser excluído:</h4>
                  <p className="text-red-700">
                    <strong>{deletingEvent.name}</strong>
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Data:{" "}
                    {deletingEvent.date ? new Date(deletingEvent.date).toLocaleDateString("pt-BR") : "Não definida"}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      setDeletingEvent(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" className="flex-1" onClick={handleDeleteEvent}>
                    Confirmar Exclusão
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
