"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type Event, type EventList } from "@/lib/supabase"
import { Calendar, Clock, Users, List, Eye, Plus, MapPin, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function EventDetailPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
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
    return <Loading text="Carregando evento..." />
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
      <Breadcrumb items={[{ label: "Eventos", href: "/events" }, { label: event.name }]} />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{event.description}</p>
        </div>

        <div className="flex space-x-2">
          <Link href={`/events/${eventId}/lists`}>
            <Button>
              <List className="w-4 h-4 mr-2" />
              Gerenciar Listas
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>

      {/* Informações do evento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data do Evento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(event.date).toLocaleDateString("pt-BR")}</div>
            {event.time && (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {event.time}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidade</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.max_capacity}</div>
            <p className="text-xs text-muted-foreground">pessoas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">nomes nas listas</p>
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
      </div>

      {/* Status do evento */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Status do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === "active"
                    ? "bg-green-100 text-green-800"
                    : event.status === "inactive"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {event.status === "active" ? "Ativo" : event.status === "inactive" ? "Inativo" : "Finalizado"}
              </div>
              <div className="text-sm text-muted-foreground">
                Criado em {new Date(event.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>

            {totalGuests > 0 && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  Taxa de Presença: {Math.round((totalCheckedIn / totalGuests) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalCheckedIn} de {totalGuests} convidados
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listas do evento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listas do Evento</span>
            <span className="text-sm font-normal text-muted-foreground">
              {eventLists.length} {eventLists.length === 1 ? "lista" : "listas"}
            </span>
          </CardTitle>
          <CardDescription>
            Diferentes tipos de listas para organizar os convidados por categoria e setor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventLists.map((list) => (
                <Card key={list.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.list_types?.color }} />
                      <span>{list.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Tipo:</span>
                        <span>{list.list_types?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium">Setor:</span>
                        <span>{list.sectors?.name}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div>
                        <div className="text-xl font-bold text-blue-600">{list._count?.guest_lists || 0}</div>
                        <div className="text-xs text-muted-foreground">Convidados</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{list._count?.checked_in || 0}</div>
                        <div className="text-xs text-muted-foreground">Check-ins</div>
                      </div>
                    </div>

                    {list.max_capacity && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span>Ocupação</span>
                          <span>
                            {list._count?.guest_lists || 0}/{list.max_capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(((list._count?.guest_lists || 0) / list.max_capacity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <Link href={`/events/${eventId}/lists/${list.id}`}>
                      <Button size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Lista
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma lista criada</h3>
              <p className="text-muted-foreground mb-4">
                {permissions.canManageEvents
                  ? "Crie listas para organizar os convidados por tipo e setor."
                  : "Não há listas disponíveis para este evento."}
              </p>
              {permissions.canManageEvents && (
                <Link href={`/events/${eventId}/lists`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Lista
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
