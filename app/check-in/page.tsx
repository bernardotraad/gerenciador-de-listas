"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { usePagination } from "@/hooks/use-pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { supabase, type Event, type GuestList } from "@/lib/supabase"
import { APP_CONFIG } from "@/lib/constants"
import { Search, UserCheck, Users, Filter } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CheckInPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [guests, setGuests] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.DEBOUNCE_DELAY)

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (user && !permissions.canCheckIn) {
      router.replace("/dashboard")
    }
  }, [user, permissions.canCheckIn, router])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar eventos ativos
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .order("date", { ascending: true })

      if (eventsError) throw eventsError

      // Buscar todos os convidados com informações das listas e eventos
      const { data: guestsData, error: guestsError } = await supabase
        .from("guest_lists")
        .select(`
          *,
          events (id, name, date, status),
          event_lists (
            id,
            name,
            event_id,
            list_types (name, color),
            sectors (name, color),
            events!event_lists_event_id_fkey (id, name, date, status)
          )
        `)
        .order("guest_name", { ascending: true })

      if (guestsError) throw guestsError

      setEvents(eventsData || [])
      setGuests(guestsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados. Tente recarregar a página.")
    } finally {
      setLoading(false)
    }
  }

  // Adicione esta função helper no início do componente, após os states
  const getEventDate = (guest: GuestList) => {
    // Primeiro tenta pegar a data do evento direto
    if (guest.events?.date) {
      return new Date(guest.events.date).toLocaleDateString("pt-BR")
    }

    // Depois tenta pegar da event_list -> events
    if (guest.event_lists?.events?.date) {
      return new Date(guest.event_lists.events.date).toLocaleDateString("pt-BR")
    }

    // Se não encontrar, busca pelo event_id
    if (guest.event_id) {
      const event = events.find((e) => e.id === guest.event_id)
      if (event?.date) {
        return new Date(event.date).toLocaleDateString("pt-BR")
      }
    }

    return "Data não disponível"
  }

  // Filtros aplicados com useMemo para otimização
  const filteredGuests = useMemo(() => {
    let filtered = guests

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
          guest.event_lists?.name?.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [guests, selectedEvent, statusFilter, debouncedSearchTerm])

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
    data: filteredGuests,
    pageSize: 20, // 20 convidados por página
  })

  // Reset página quando filtros mudam
  useEffect(() => {
    resetPage()
  }, [selectedEvent, statusFilter, debouncedSearchTerm, resetPage])

  const handleCheckIn = async (guestId: string, guestName: string) => {
    setSubmitting(guestId)
    try {
      const { error } = await supabase
        .from("guest_lists")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", guestId)

      if (error) throw error

      const guest = guests.find((g) => g.id === guestId)

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: guest?.event_id || guest?.event_lists?.events?.id,
          action: "Check-in realizado",
          details: `Check-in de "${guestName}" foi realizado por ${user!.name}`,
        },
      ])

      toast.success(`Check-in de ${guestName} realizado com sucesso!`)
      fetchData()
    } catch (error) {
      console.error("Erro ao realizar check-in:", error)
      toast.error("Erro ao realizar check-in")
    } finally {
      setSubmitting(null)
    }
  }

  const handleCheckOut = async (guestId: string, guestName: string) => {
    setSubmitting(guestId)
    try {
      const { error } = await supabase
        .from("guest_lists")
        .update({
          checked_in: false,
          checked_in_at: null,
        })
        .eq("id", guestId)

      if (error) throw error

      const guest = guests.find((g) => g.id === guestId)

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: guest?.event_id || guest?.event_lists?.events?.id,
          action: "Check-in desfeito",
          details: `Check-in de "${guestName}" foi desfeito por ${user!.name}`,
        },
      ])

      toast.success(`Check-in de ${guestName} foi desfeito`)
      fetchData()
    } catch (error) {
      console.error("Erro ao desfazer check-in:", error)
      toast.error("Erro ao desfazer check-in")
    } finally {
      setSubmitting(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedEvent("all")
    setStatusFilter("all")
  }

  if (!permissions.canCheckIn) {
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
    return <Loading text="Carregando check-in..." />
  }

  const checkedInCount = filteredGuests.filter((g) => g.checked_in).length
  const totalGuests = filteredGuests.length
  const hasActiveFilters = selectedEvent !== "all" || statusFilter !== "all" || searchTerm.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Check-in de Convidados</h1>
        <p className="text-muted-foreground">Confirme a entrada dos convidados nos eventos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">{hasActiveFilters ? "filtrados" : "nomes nas listas"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground">pessoas já entraram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">dos convidados presentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Check-in</span>
            <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
              <span>
                {totalItems} {totalItems === 1 ? "convidado" : "convidados"}
              </span>
              {totalPages > 1 && (
                <>
                  <span>•</span>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                </>
              )}
            </div>
          </CardTitle>
          <CardDescription>Gerencie a entrada dos convidados</CardDescription>

          {/* Filtros */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full md:w-[250px] h-12">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="h-12 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Versão mobile - Cards */}
          <div className="block md:hidden space-y-3">
            {paginatedData.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-lg">{guest.guest_name}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>Evento:</span>
                        <span>{guest.events?.name || guest.event_lists?.events?.name}</span>
                      </div>
                      {guest.event_lists && (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: guest.event_lists.list_types?.color }}
                          />
                          <span>{guest.event_lists.name}</span>
                          <span>•</span>
                          <span>{guest.event_lists.sectors?.name}</span>
                        </div>
                      )}
                      <div>Data: {getEventDate(guest)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {guest.checked_in ? (
                        <div>
                          <span className="text-green-600 font-medium">✓ Confirmado</span>
                          {guest.checked_in_at && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(guest.checked_in_at).toLocaleString("pt-BR")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pendente</span>
                      )}
                    </div>

                    {guest.checked_in ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckOut(guest.id, guest.guest_name)}
                        disabled={submitting === guest.id}
                        className="h-10 px-4"
                      >
                        {submitting === guest.id ? "..." : "Desfazer"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(guest.id, guest.guest_name)}
                        disabled={submitting === guest.id}
                        className="h-10 px-6 bg-green-600 hover:bg-green-700"
                      >
                        {submitting === guest.id ? "..." : "Check-in"}
                      </Button>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Evento / Lista</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.guest_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{guest.events?.name || guest.event_lists?.events?.name}</div>
                        {guest.event_lists && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: guest.event_lists.list_types?.color }}
                            />
                            <span>{guest.event_lists.name}</span>
                            <span>•</span>
                            <span>{guest.event_lists.sectors?.name}</span>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">{getEventDate(guest)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guest.checked_in ? (
                        <div>
                          <span className="text-green-600 font-medium">✓ Confirmado</span>
                          {guest.checked_in_at && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(guest.checked_in_at).toLocaleString("pt-BR")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pendente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.checked_in ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(guest.id, guest.guest_name)}
                          disabled={submitting === guest.id}
                        >
                          {submitting === guest.id ? "..." : "Desfazer"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(guest.id, guest.guest_name)}
                          disabled={submitting === guest.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {submitting === guest.id ? "..." : "Check-in"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                showInfo={true}
              />
            </div>
          )}

          {filteredGuests.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "Nenhum convidado encontrado" : "Nenhum convidado cadastrado"}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Não há convidados cadastrados para check-in."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent">
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
