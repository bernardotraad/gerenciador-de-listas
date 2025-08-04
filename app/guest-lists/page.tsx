"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronRight, Users, Search, Filter, Plus, Send, Calendar, MapPin, Palette } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"

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
  events: { name: string; date: string }
  list_types: { name: string; color: string }
  sectors: { name: string; color: string }
}

interface GuestList {
  id: string
  name: string
  event_id: string
  event_list_id?: string
  checked_in: boolean
  checked_in_at?: string
  created_at: string
  events: { name: string; date: string }
  event_lists?: {
    name: string
    list_types: { name: string; color: string }
    sectors: { name: string; color: string }
  }
  users: { name: string; email: string }
}

const GuestListsPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [events, setEvents] = useState<Event[]>([])
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [guestLists, setGuestLists] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    event_id: "",
    event_list_id: "",
    send_type: "event" as "event" | "list",
    guest_names: "",
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const handleLoadData = async () => {
    try {
      const [eventsResult, guestListsResult] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("status", "active")
          .order("date", { ascending: true }),
        supabase
          .from("guest_lists")
          .select(`
            *,
            events (name, date),
            event_lists (
              name,
              list_types (name, color),
              sectors (name, color)
            ),
            users (name, email)
          `)
          .order("created_at", { ascending: false }),
      ])

      if (eventsResult.error) throw eventsResult.error
      if (guestListsResult.error) throw guestListsResult.error

      setEvents(eventsResult.data || [])
      setGuestLists(guestListsResult.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleLoadEventLists = async () => {
    try {
      const { data, error } = await supabase
        .from("event_lists")
        .select(`
          *,
          events (name, date),
          list_types (name, color),
          sectors (name, color)
        `)
        .eq("is_active", true)
        .order("name", { ascending: true })

      if (error) throw error

      setEventLists(data || [])
    } catch (error) {
      console.error("Erro ao carregar listas:", error)
      toast.error("Erro ao carregar listas")
    }
  }

  const handleSubmitGuests = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!customUser) return

    try {
      const namesArray = formData.guest_names
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name.length > 0)

      if (namesArray.length === 0) {
        toast.error("Por favor, insira pelo menos um nome")
        return
      }

      const guestData = namesArray.map((name) => ({
        name,
        event_id: formData.event_id,
        event_list_id: formData.send_type === "list" ? formData.event_list_id : null,
        submitted_by: customUser.id,
        submitted_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("guest_lists").insert(guestData)

      if (error) throw error

      toast.success(`${namesArray.length} nome(s) enviado(s) com sucesso!`)
      setIsDialogOpen(false)
      setFormData({
        event_id: "",
        event_list_id: "",
        send_type: "event",
        guest_names: "",
      })
      handleLoadData()
    } catch (error: any) {
      console.error("Erro ao enviar convidados:", error)
      toast.error(error.message || "Erro ao enviar convidados")
    }
  }

  const handleToggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleExpandAll = () => {
    const allGroups = new Set(guestLists.map((guest) => guest.event_id))
    setExpandedGroups(allGroups)
  }

  const handleCollapseAll = () => {
    setExpandedGroups(new Set())
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedEvent("all")
    setStatusFilter("all")
  }

  const handleFormDataChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventDate = (eventDate: string | null | undefined, fallbackDate: string | null | undefined): string => {
    return formatDate(eventDate || fallbackDate)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleEventChange = (value: string) => {
    setSelectedEvent(value)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  // Filtros e agrupamento
  const filteredGuestLists = useMemo(() => {
    let filtered = guestLists

    // Filtro por busca
    if (debouncedSearchTerm) {
      filtered = filtered.filter((guest) =>
        guest.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        guest.events.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Filtro por evento
    if (selectedEvent !== "all") {
      filtered = filtered.filter((guest) => guest.event_id === selectedEvent)
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((guest) => {
        if (statusFilter === "checked_in") return guest.checked_in
        if (statusFilter === "not_checked_in") return !guest.checked_in
        return true
      })
    }

    return filtered
  }, [guestLists, debouncedSearchTerm, selectedEvent, statusFilter])

  const groupedGuestLists = useMemo(() => {
    const groups: { [key: string]: GuestList[] } = {}
    
    filteredGuestLists.forEach((guest) => {
      const eventId = guest.event_id
      if (!groups[eventId]) {
        groups[eventId] = []
      }
      groups[eventId].push(guest)
    })

    return groups
  }, [filteredGuestLists])

  useEffect(() => {
    if (customUser) {
      handleLoadData()
      handleLoadEventLists()
    }
  }, [customUser])

  if (!permissions.canViewGuestLists) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para visualizar listas de convidados.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando listas de convidados..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Listas de Convidados</h1>
          <p className="text-muted-foreground">Gerencie as listas de convidados dos eventos</p>
        </div>

        {permissions.canSubmitGuests && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Enviar Nomes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Enviar Nomes de Convidados</DialogTitle>
                <DialogDescription>
                  Adicione nomes de convidados para um evento ou lista específica
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitGuests} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event_id">Evento</Label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => handleFormDataChange("event_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {formatDate(event.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="send_type">Tipo de Envio</Label>
                  <Select
                    value={formData.send_type}
                    onValueChange={(value) => handleFormDataChange("send_type", value as "event" | "list")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Para o Evento</SelectItem>
                      <SelectItem value="list">Para uma Lista Específica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.send_type === "list" && (
                  <div className="space-y-2">
                    <Label htmlFor="event_list_id">Lista</Label>
                    <Select
                      value={formData.event_list_id}
                      onValueChange={(value) => handleFormDataChange("event_list_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma lista" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventLists
                          .filter((list) => list.event_id === formData.event_id)
                          .map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.list_types.name} - {list.sectors.name})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="guest_names">Nomes dos Convidados</Label>
                  <Textarea
                    id="guest_names"
                    placeholder="Digite um nome por linha..."
                    value={formData.guest_names}
                    onChange={(e) => handleFormDataChange("guest_names", e.target.value)}
                    rows={6}
                    aria-label="Nomes dos convidados, um por linha"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  className="pl-8"
                  aria-label="Buscar convidados por nome ou evento"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_filter">Evento</Label>
              <Select value={selectedEvent} onValueChange={handleEventChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_filter">Status</Label>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="checked_in">Check-in realizado</SelectItem>
                  <SelectItem value="not_checked_in">Check-in pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Expansão */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            Expandir Todos
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            Recolher Todos
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredGuestLists.length} convidado(s) encontrado(s)
        </div>
      </div>

      {/* Lista de Convidados */}
      <div className="space-y-4">
        {Object.entries(groupedGuestLists).map(([eventId, guests]) => {
          const event = events.find((e) => e.id === eventId)
          const isExpanded = expandedGroups.has(eventId)
          const checkedInCount = guests.filter((guest) => guest.checked_in).length

          return (
            <Card key={eventId}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleToggleGroup(eventId)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleToggleGroup(eventId)
                  }
                }}
                aria-label={`${isExpanded ? "Recolher" : "Expandir"} lista do evento ${event?.name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{event?.name}</CardTitle>
                      <CardDescription>
                        {formatDate(event?.date)} • {guests.length} convidado(s) • {checkedInCount} check-in(s)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={event?.status === "active" ? "default" : "secondary"}>
                    {event?.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-3">
                    {guests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{guest.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Enviado por: {guest.users.name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Enviado em: {formatDateTime(guest.created_at)}
                            </p>
                            {guest.checked_in && (
                              <p className="text-sm text-green-600">
                                Check-in: {formatDateTime(guest.checked_in_at)}
                              </p>
                            )}
                          </div>
                          <Badge variant={guest.checked_in ? "default" : "secondary"}>
                            {guest.checked_in ? "Check-in" : "Pendente"}
                          </Badge>
                          {guest.event_lists && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: guest.event_lists.list_types.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {guest.event_lists.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}

        {Object.keys(groupedGuestLists).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum convidado encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GuestListsPage
