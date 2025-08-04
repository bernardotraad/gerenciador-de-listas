"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Calendar, Plus, Search, MapPin, Clock, Users, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Event {
  id: string
  name: string
  description: string
  date: string
  location: string
  status: "active" | "inactive" | "completed"
  created_by: string
  created_at: string
  updated_at: string
}

const EventsPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const handleLoadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
      toast.error("Erro ao carregar eventos")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId)

      if (error) throw error

      toast.success("Evento excluído com sucesso!")
      handleLoadEvents()
    } catch (error: any) {
      console.error("Erro ao excluir evento:", error)
      toast.error(error.message || "Erro ao excluir evento")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
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

  useEffect(() => {
    if (customUser) {
      handleLoadEvents()
    }
  }, [customUser])

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
    return <Loading text="Carregando eventos..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">Gerencie os eventos do sistema</p>
        </div>

        {permissions.canCreateEvents && (
          <Link href="/events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>Visualize e gerencie todos os eventos</CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-8"
              aria-label="Buscar eventos por nome, descrição ou local"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                  <div className="flex items-center space-x-2">
                    <Link href={`/events/${event.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        aria-label={`Ver detalhes do evento ${event.name}`}
                        tabIndex={0}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {permissions.canEditEvents && (
                      <Link href={`/events/${event.id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          aria-label={`Editar evento ${event.name}`}
                          tabIndex={0}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {permissions.canDeleteEvents && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        aria-label={`Excluir evento ${event.name}`}
                        tabIndex={0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum evento encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EventsPage
