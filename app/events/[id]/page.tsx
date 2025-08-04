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
import { Calendar, MapPin, Clock, Users, Edit, Trash2, List, Plus, Eye } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Event {
  id: string
  name: string
  description: string
  date: string
  time: string
  location: string
  status: "active" | "inactive" | "completed"
  max_capacity: number
  created_by: string
  created_at: string
  updated_at: string
}

interface EventList {
  id: string
  name: string
  list_type_id: string
  sector_id: string
  is_active: boolean
  max_capacity: number
  current_count: number
  list_types: { name: string; color: string }
  sectors: { name: string; color: string }
}

const EventDetailPage = () => {
  const params = useParams()
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [loading, setLoading] = useState(true)

  const eventId = params.id as string

  const handleLoadEventData = async () => {
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
      console.error("Erro ao carregar dados do evento:", error)
      toast.error("Erro ao carregar dados do evento")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!event) return

    try {
      const { error } = await supabase.from("events").delete().eq("id", event.id)

      if (error) throw error

      toast.success("Evento excluído com sucesso!")
      window.location.href = "/events"
    } catch (error: any) {
      console.error("Erro ao excluir evento:", error)
      toast.error(error.message || "Erro ao excluir evento")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativo</Badge>
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>
      case "completed":
        return <Badge variant="outline">Concluído</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCapacityPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  useEffect(() => {
    if (eventId) {
      handleLoadEventData()
    }
  }, [eventId])

  if (!permissions.canViewEvents) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para visualizar eventos.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando detalhes do evento..." />
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
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{event.description}</p>
        </div>

        <div className="flex items-center space-x-2">
          {permissions.canEditEvents && (
            <Link href={`/events/${event.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
          {permissions.canDeleteEvents && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              aria-label="Excluir evento"
              tabIndex={0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Informações do Evento */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-2xl font-bold">{formatDate(event.date)}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Horário</p>
                <p className="text-2xl font-bold">{formatTime(event.time)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-2xl font-bold">{event.location}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <div className="mt-1">{getStatusBadge(event.status)}</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
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
              <List className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Taxa de Ocupação</p>
                <p className="text-2xl font-bold">
                  {totalCapacity > 0 ? getCapacityPercentage(totalGuests, totalCapacity) : 0}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listas do Evento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Listas do Evento</CardTitle>
              <CardDescription>Gerencie as listas de convidados para este evento</CardDescription>
            </div>

            {permissions.canManageLists && (
              <Link href={`/events/${event.id}/lists/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Lista
                </Button>
              </Link>
            )}
          </div>
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
                      {getCapacityPercentage(list.current_count, list.max_capacity)}% ocupado
                    </div>
                  </div>
                  <Badge variant={list.is_active ? "default" : "secondary"}>
                    {list.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Link href={`/events/${event.id}/lists/${list.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        aria-label={`Ver detalhes da lista ${list.name}`}
                        tabIndex={0}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {permissions.canManageLists && (
                      <Link href={`/events/${event.id}/lists/${list.id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          aria-label={`Editar lista ${list.name}`}
                          tabIndex={0}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
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
                  <Link href={`/events/${event.id}/lists/new`}>
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

      {/* Informações Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Criado em:</span>
              <span className="text-sm">{formatDate(event.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Última atualização:</span>
              <span className="text-sm">{formatDate(event.updated_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Capacidade máxima:</span>
              <span className="text-sm">{event.max_capacity} pessoas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/events/${event.id}/lists`}>
              <Button variant="outline" className="w-full justify-start">
                <List className="w-4 h-4 mr-2" />
                Ver Todas as Listas
              </Button>
            </Link>
            <Link href="/check-in">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Fazer Check-in
              </Button>
            </Link>
            <Link href="/guest-lists">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Ver Convidados
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EventDetailPage
