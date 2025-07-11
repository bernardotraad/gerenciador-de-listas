"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/lib/auth"
import { supabase, type Event, type GuestList, type EventList } from "@/lib/supabase"
import { usePagination } from "@/hooks/use-pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { groupGuestLists, formatName } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/constants"
import {
  Plus,
  Users,
  Globe,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Mail,
  CheckCircle,
  Clock,
  List,
  MapPin,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

// Função para formatar data com validação
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Data não definida"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data inválida"

    return date.toLocaleDateString("pt-BR")
  } catch {
    return "Data inválida"
  }
}

// Função para formatar data e hora com validação
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Data não definida"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Data inválida"

    return date.toLocaleString("pt-BR")
  } catch {
    return "Data inválida"
  }
}

// Função para obter a data do evento ou usar fallback
const getEventDate = (eventDate: string | null | undefined, fallbackDate: string | null | undefined): string => {
  // Primeiro tenta usar a data do evento
  if (eventDate) {
    try {
      const date = new Date(eventDate)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR")
      }
    } catch {
      // Continua para o fallback
    }
  }

  // Se não tem data do evento, usa a data de criação como fallback
  if (fallbackDate) {
    try {
      const date = new Date(fallbackDate)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR")
      }
    } catch {
      // Continua para o fallback final
    }
  }

  return "Data não definida"
}

export default function GuestListsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [guestLists, setGuestLists] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    event_id: "",
    event_list_id: "",
    send_type: "event", // "event" ou "list"
  })

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.DEBOUNCE_DELAY)

  useEffect(() => {
    fetchData()
  }, [])

  // Buscar listas quando evento for selecionado no dialog
  useEffect(() => {
    if (formData.send_type === "list") {
      fetchEventListsForDialog()
    }
  }, [formData.send_type])

  const fetchData = async () => {
    try {
      // Buscar eventos ativos
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .order("date", { ascending: true })

      if (eventsError) throw eventsError

      // Buscar listas de convidados
      const { data: guestListsData, error: guestListsError } = await supabase
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
        .order("created_at", { ascending: false })

      if (guestListsError) throw guestListsError

      setEvents(eventsData || [])
      setGuestLists(guestListsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados. Tente recarregar a página.")
    } finally {
      setLoading(false)
    }
  }

  const fetchEventListsForDialog = async () => {
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

  // Filtros aplicados com useMemo para otimização
  const filteredGuestLists = useMemo(() => {
    let filtered = guestLists

    // Filtro por evento
    if (selectedEvent !== "all") {
      filtered = filtered.filter(
        (guest) => guest.event_id === selectedEvent || guest.event_lists?.events?.id === selectedEvent,
      )
    }

    // Filtro por status de check-in
    if (statusFilter === "checked-in") {
      filtered = filtered.filter((guest) => guest.checked_in)
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((guest) => !guest.checked_in)
    }

    // Filtro por busca
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (guest) =>
          guest.guest_name.toLowerCase().includes(searchLower) ||
          guest.events?.name.toLowerCase().includes(searchLower) ||
          guest.event_lists?.name?.toLowerCase().includes(searchLower) ||
          guest.users?.name?.toLowerCase().includes(searchLower) ||
          guest.sender_name?.toLowerCase().includes(searchLower) ||
          guest.sender_email?.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [guestLists, selectedEvent, statusFilter, debouncedSearchTerm])

  // Agrupar listas filtradas
  const groupedLists = useMemo(() => {
    return groupGuestLists(filteredGuestLists)
  }, [filteredGuestLists])

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    totalItems,
    startIndex,
    endIndex,
    resetPage,
  } = usePagination({
    data: groupedLists,
    pageSize: 10,
  })

  // Reset página quando filtros mudam
  useEffect(() => {
    resetPage()
  }, [selectedEvent, statusFilter, debouncedSearchTerm, resetPage])

  const handleSubmitGuests = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formDataObj = new FormData(e.currentTarget)
    const guestNames = (formDataObj.get("guest_names") as string)
      .split("\n")
      .map((name) => formatName(name.trim()))
      .filter((name) => name.length > 0)

    if (guestNames.length === 0) {
      toast.error("Por favor, adicione pelo menos um nome")
      return
    }

    try {
      // Verificar capacidade máxima se enviando para lista específica
      if (formData.send_type === "list" && formData.event_list_id) {
        const selectedList = eventLists.find((list) => list.id === formData.event_list_id)

        if (selectedList?.max_capacity) {
          const { count: currentCount } = await supabase
            .from("guest_lists")
            .select("*", { count: "exact", head: true })
            .eq("event_list_id", formData.event_list_id)

          const totalAfterAdd = (currentCount || 0) + guestNames.length

          if (totalAfterAdd > selectedList.max_capacity) {
            toast.error(
              `A lista "${selectedList.name}" tem capacidade para ${selectedList.max_capacity} pessoas. ` +
                `Atualmente há ${currentCount || 0} nomes. ` +
                `Você está tentando adicionar ${guestNames.length} nomes, ` +
                `o que excederia a capacidade em ${totalAfterAdd - selectedList.max_capacity} pessoas.`,
            )
            return
          }
        }
      }

      // Preparar dados para inserção
      const guestsData = guestNames.map((name) => ({
        // Se enviando para lista específica, usar event_list_id, senão usar event_id
        ...(formData.send_type === "list"
          ? { event_list_id: formData.event_list_id }
          : { event_id: formData.event_id }),
        guest_name: name.substring(0, APP_CONFIG.VALIDATION.MAX_GUEST_NAME_LENGTH),
        submitted_by: user.id,
        status: "approved",
      }))

      const { error } = await supabase.from("guest_lists").insert(guestsData)

      if (error) throw error

      // Log da atividade
      const selectedEvent = events.find((e) => e.id === formData.event_id)
      const selectedList = eventLists.find((l) => l.id === formData.event_list_id)

      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          event_id: formData.send_type === "list" ? selectedList?.event_id : formData.event_id,
          action: "Lista de nomes enviada",
          details:
            formData.send_type === "list"
              ? `${guestNames.length} nomes enviados para "${selectedList?.name}" no evento "${selectedList?.events?.name}"`
              : `${guestNames.length} nomes enviados para o evento "${selectedEvent?.name}"`,
        },
      ])

      const successMessage =
        formData.send_type === "list"
          ? `${guestNames.length} nomes enviados com sucesso para a lista "${selectedList?.name}"!`
          : `${guestNames.length} nomes enviados com sucesso!`

      toast.success(successMessage)
      setDialogOpen(false)
      setFormData({ event_id: "", event_list_id: "", send_type: "event" })
      setEventLists([])
      fetchData()
    } catch (error) {
      console.error("Erro ao enviar lista:", error)
      toast.error("Erro ao enviar lista de nomes")
    }
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => {
    setExpandedGroups(new Set(paginatedData.map((group) => group.id)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedEvent("all")
    setStatusFilter("all")
  }

  const handleFormDataChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Limpar lista selecionada quando mudar o tipo de envio ou evento
    if (field === "send_type" || field === "event_id") {
      setFormData((prev) => ({ ...prev, event_list_id: "" }))
      if (field === "send_type" && value === "event") {
        setEventLists([])
      }
    }
  }

  if (loading) {
    return <Loading text="Carregando listas de convidados..." />
  }

  const hasActiveFilters = selectedEvent !== "all" || statusFilter !== "all" || searchTerm.length > 0
  const totalGuests = filteredGuestLists.length
  const selectedList = eventLists.find((list) => list.id === formData.event_list_id)

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Listas de Convidados</h1>
          <p className="text-muted-foreground">
            {user ? "Envie listas de nomes para os eventos" : "Visualize as listas de convidados"}
          </p>
        </div>

        {user && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Enviar Lista
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Lista de Nomes</DialogTitle>
                <DialogDescription>Escolha o destino e adicione os nomes dos convidados</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitGuests} className="space-y-4">
                {/* Tipo de envio */}
                <div className="space-y-2">
                  <Label>Tipo de Envio</Label>
                  <Select
                    value={formData.send_type}
                    onValueChange={(value) => handleFormDataChange("send_type", value)}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Como deseja enviar?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium">Envio Geral</div>
                            <div className="text-xs text-muted-foreground">Para o evento (sem lista específica)</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center space-x-2">
                          <List className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium">Lista Específica</div>
                            <div className="text-xs text-muted-foreground">Escolher tipo e setor</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção do evento */}
                <div className="space-y-2">
                  <Label htmlFor="event_id">Evento</Label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => handleFormDataChange("event_id", value)}
                    required
                  >
                    <SelectTrigger className="h-12">
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

                {/* Seleção da lista específica */}
                {formData.send_type === "list" && formData.event_id && (
                  <div className="space-y-2">
                    <Label htmlFor="event_list_id">Lista Específica</Label>
                    <Select
                      value={formData.event_list_id}
                      onValueChange={(value) => handleFormDataChange("event_list_id", value)}
                      required
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione uma lista" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: list.list_types?.color }}
                              />
                              <div>
                                <div className="font-medium">{list.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {list.list_types?.name} • {list.sectors?.name} • {list.events?.name}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedList && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedList.list_types?.color }}
                          />
                          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedList.name}</span>
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedList.list_types?.name} • {selectedList.sectors?.name}
                          {selectedList.max_capacity && ` • Cap: ${selectedList.max_capacity}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="guest_names">Lista de Nomes</Label>
                  <Textarea
                    id="guest_names"
                    name="guest_names"
                    placeholder={`João Silva
Maria Santos
Pedro Oliveira
Ana Costa
Carlos Ferreira
...`}
                    rows={10}
                    required
                    className="resize-none text-base min-h-[250px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite um nome por linha. Os nomes serão formatados automaticamente.
                  </p>
                </div>
                <Button type="submit" className="w-full h-12">
                  Enviar Lista
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listas Enviadas</span>
            <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
              <span>
                {totalItems} {totalItems === 1 ? "lista" : "listas"}
              </span>
              <span>•</span>
              <span>
                {totalGuests} {totalGuests === 1 ? "convidado" : "convidados"}
              </span>
            </div>
          </CardTitle>
          <CardDescription>Listas agrupadas por remetente e evento, organizadas alfabeticamente</CardDescription>

          {/* Filtros */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, evento ou remetente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full md:w-[200px] h-12">
                <SelectValue placeholder="Filtrar por evento" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-12">
                <SelectValue placeholder="Status do check-in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="checked-in">Já fizeram check-in</SelectItem>
                <SelectItem value="pending">Aguardando check-in</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="h-12 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {/* Controles de expansão */}
          {paginatedData.length > 0 && (
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir Todas
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Recolher Todas
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedData.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              const checkedInCount = group.guests.filter((g) => g.checked_in).length
              const totalInGroup = group.guests.length

              // Usar a data do evento ou a data de criação do primeiro guest como fallback
              const firstGuestDate = group.guests[0]?.created_at
              const displayDate = getEventDate(group.event_date, firstGuestDate)

              return (
                <Collapsible key={group.id} open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}

                            <div className="flex items-center space-x-2">
                              {group.sender_type === "user" ? (
                                <User className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Globe className="w-4 h-4 text-green-600" />
                              )}
                              <div>
                                <div className="font-medium">{group.sender_name}</div>
                                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                  <Mail className="w-3 h-3" />
                                  <span>{group.sender_email}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{group.event_name}</span>
                                </div>
                                <div className="text-muted-foreground">{displayDate}</div>
                              </div>

                              <div className="text-center">
                                <div className="text-lg font-bold">{totalInGroup}</div>
                                <div className="text-xs text-muted-foreground">
                                  {totalInGroup === 1 ? "nome" : "nomes"}
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">{checkedInCount}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">confirmados</div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-600">
                                    {totalInGroup - checkedInCount}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">pendentes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          {/* Versão mobile - Cards */}
                          <div className="block md:hidden space-y-3">
                            {group.guests.map((guest) => (
                              <Card key={guest.id} className="p-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{guest.guest_name}</div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      {guest.event_lists && (
                                        <div className="flex items-center space-x-2">
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: guest.event_lists.list_types?.color }}
                                          />
                                          <span>{guest.event_lists.name}</span>
                                          <MapPin className="w-3 h-3" />
                                          <span>{guest.event_lists.sectors?.name}</span>
                                        </div>
                                      )}
                                      <div>Enviado em {formatDate(guest.created_at)}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {guest.checked_in ? (
                                      <div>
                                        <span className="text-green-600 font-medium text-sm">✓ Confirmado</span>
                                        {guest.checked_in_at && (
                                          <div className="text-xs text-muted-foreground">
                                            {formatDateTime(guest.checked_in_at)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-orange-600 text-sm">Pendente</span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          {/* Versão desktop - Tabela */}
                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome do Convidado</TableHead>
                                  <TableHead>Lista/Setor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Data de Envio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.guests.map((guest) => (
                                  <TableRow key={guest.id}>
                                    <TableCell className="font-medium">{guest.guest_name}</TableCell>
                                    <TableCell>
                                      {guest.event_lists ? (
                                        <div className="flex items-center space-x-2">
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: guest.event_lists.list_types?.color }}
                                          />
                                          <div>
                                            <div className="font-medium text-sm">{guest.event_lists.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center space-x-1">
                                              <span>{guest.event_lists.list_types?.name}</span>
                                              <span>•</span>
                                              <MapPin className="w-3 h-3" />
                                              <span>{guest.event_lists.sectors?.name}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">Envio geral</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {guest.checked_in ? (
                                        <div>
                                          <span className="text-green-600 font-medium">✓ Confirmado</span>
                                          {guest.checked_in_at && (
                                            <div className="text-xs text-muted-foreground">
                                              {formatDateTime(guest.checked_in_at)}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-orange-600">Pendente</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDate(guest.created_at)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </div>
          )}

          {groupedLists.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "Nenhum resultado encontrado" : "Nenhuma lista enviada"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Envie a primeira lista de nomes para um evento."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
