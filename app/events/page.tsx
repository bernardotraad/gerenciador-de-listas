"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Search, Plus, Filter, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Event {
  id: string
  name: string
  description: string
  date: string
  location: string
  capacity: number
  status: "draft" | "published" | "active" | "completed" | "cancelled"
  created_at: string
  total_guests?: number
  checked_in_guests?: number
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  published: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels = {
  draft: "Rascunho",
  published: "Publicado",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
}

export default function EventsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      console.log("🔄 Carregando eventos...")
      setLoading(true)

      // Buscar eventos básicos primeiro
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false })

      if (eventsError) {
        console.error("❌ Erro ao buscar eventos:", eventsError)
        setEvents([])
        return
      }

      console.log("📊 Eventos encontrados:", eventsData?.length || 0)

      if (!eventsData || eventsData.length === 0) {
        console.log("📭 Nenhum evento encontrado")
        setEvents([])
        return
      }

      // Buscar estatísticas para cada evento
      const eventsWithStats = await Promise.all(
        eventsData.map(async (event) => {
          try {
            // Contar total de convidados
            const { count: totalGuests } = await supabase
              .from("guest_list_entries")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)

            // Contar check-ins
            const { count: checkedInGuests } = await supabase
              .from("check_ins")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)

            return {
              ...event,
              total_guests: totalGuests || 0,
              checked_in_guests: checkedInGuests || 0,
            }
          } catch (error) {
            console.error(`❌ Erro ao buscar stats do evento ${event.id}:`, error)
            return {
              ...event,
              total_guests: 0,
              checked_in_guests: 0,
            }
          }
        }),
      )

      console.log("✅ Eventos carregados com estatísticas:", eventsWithStats.length)
      setEvents(eventsWithStats)
    } catch (error) {
      console.error("❌ Erro geral ao carregar eventos:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "date":
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case "capacity":
        return b.capacity - a.capacity
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Eventos</h1>
            <p className="text-muted-foreground">Carregando eventos...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Estado vazio - verificação corrigida
  if (!events || events.length === 0) {
    console.log("📭 Mostrando estado vazio - nenhum evento encontrado")
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Eventos</h1>
            <p className="text-muted-foreground">Gerencie seus eventos</p>
          </div>
          {permissions.canCreateEvents && (
            <Link href="/events/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nenhum evento criado ainda</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Crie seu primeiro evento para começar a gerenciar listas de convidados e realizar check-ins.
          </p>
          {permissions.canCreateEvents && (
            <Link href="/events/create">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            {events.length} evento{events.length !== 1 ? "s" : ""} encontrado{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        {permissions.canCreateEvents && (
          <Link href="/events/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Data</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="capacity">Capacidade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de eventos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{event.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </div>
                <Badge variant="outline" className={statusColors[event.status]}>
                  {statusLabels[event.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {event.total_guests || 0} / {event.capacity} convidados
                </div>
                {event.total_guests && event.total_guests > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {event.checked_in_guests || 0} check-ins realizados
                  </div>
                )}
                <div className="pt-3">
                  <Link href={`/events/${event.id}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && events.length > 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros ou termo de busca.</p>
        </div>
      )}
    </div>
  )
}
