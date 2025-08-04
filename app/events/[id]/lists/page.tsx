"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { List, Plus, Edit, Trash2, Eye, Users, MapPin, Palette } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Event {
  id: string
  name: string
  date: string
  status: string
}

interface EventList {
  id: string
  name: string
  event_id: string
  list_type_id: string
  sector_id: string
  is_active: boolean
  max_capacity: number
  current_count: number
  list_types: { name: string; color: string }
  sectors: { name: string; color: string }
}

const EventListsPage = () => {
  const params = useParams()
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [loading, setLoading] = useState(true)

  const eventId = params.id as string

  const handleLoadEventLists = async () => {
    try {
      const [eventResult, listsResult] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).single(),
        supabase
          .from("event_lists")
          .select(`
            *,
            list_types (name, color),
            sectors (name, color)
          `)
          .eq("event_id", eventId)
          .order("name", { ascending: true }),
      ])

      if (eventResult.error) throw eventResult.error
      if (listsResult.error) throw listsResult.error

      setEvent(eventResult.data)
      setEventLists(listsResult.data || [])
    } catch (error) {
      console.error("Erro ao carregar listas do evento:", error)
      toast.error("Erro ao carregar listas do evento")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from("event_lists").delete().eq("id", listId)

      if (error) throw error

      toast.success("Lista excluída com sucesso!")
      handleLoadEventLists()
    } catch (error: any) {
      console.error("Erro ao excluir lista:", error)
      toast.error(error.message || "Erro ao excluir lista")
    }
  }

  const handleFormatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleGetCapacityPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  useEffect(() => {
    if (eventId) {
      handleLoadEventLists()
    }
  }, [eventId])

  if (!permissions.canViewLists) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para visualizar listas de eventos.</p>
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
          <p>O evento que você está procurando não existe ou foi removido.</p>
          <Link href="/events">
            <Button className="mt-4">Voltar para Eventos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalGuests = eventLists.reduce((sum, list) => sum + list.current_count, 0)
  const totalCapacity = eventLists.reduce((sum, list) => sum + list.max_capacity, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Listas do Evento</h1>
          <p className="text-muted-foreground">
            {event.name} - {handleFormatDate(event.date)}
          </p>
        </div>

        {permissions.canManageLists && (
          <Link href={`/events/${eventId}/lists/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Lista
            </Button>
          </Link>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total de Listas</p>
                <p className="text-2xl font-bold">{eventLists.length}</p>
              </div>
              <List className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total de Convidados</p>
                <p className="text-2xl font-bold">{totalGuests}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Capacidade Total</p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listas de Convidados</CardTitle>
          <CardDescription>Gerencie as listas de convidados para este evento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventLists.map((list) => (
              <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: list.list_types.color }}
                    />
                    <div>
                      <h3 className="font-medium">{list.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {list.list_types.name} • {list.sectors.name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {list.current_count} / {list.max_capacity} convidados
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {handleGetCapacityPercentage(list.current_count, list.max_capacity)}% ocupado
                    </div>
                  </div>
                  <Badge variant={list.is_active ? "default" : "secondary"}>
                    {list.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Link href={`/events/${eventId}/lists/${list.id}`}>
                      <Button variant="ghost" size="sm" aria-label={`Ver detalhes da lista ${list.name}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {permissions.canManageLists && (
                      <>
                        <Link href={`/events/${eventId}/lists/${list.id}/edit`}>
                          <Button variant="ghost" size="sm" aria-label={`Editar lista ${list.name}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteList(list.id)}
                          aria-label={`Excluir lista ${list.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {eventLists.length === 0 && (
              <div className="text-center py-8">
                <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma lista criada para este evento</p>
                {permissions.canManageLists && (
                  <Link href={`/events/${eventId}/lists/new`}>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Lista
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Informações do Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Nome do Evento:</span>
            <span className="text-sm font-medium">{event.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Data:</span>
            <span className="text-sm">{handleFormatDate(event.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={event.status === "active" ? "default" : "secondary"}>
              {event.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EventListsPage
