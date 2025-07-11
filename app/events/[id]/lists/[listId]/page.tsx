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
import { supabase, type Event, type EventList, type GuestList } from "@/lib/supabase"
import { APP_CONFIG } from "@/lib/constants"
import { Search, UserCheck, Users, Filter, Download, Plus, Trash2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function EventListDetailPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const listId = params.listId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [eventList, setEventList] = useState<EventList | null>(null)
  const [guests, setGuests] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.DEBOUNCE_DELAY)

  useEffect(() => {
    if (!permissions.canViewEvents) {
      router.replace("/dashboard")
      return
    }
    fetchData()
  }, [eventId, listId, permissions.canViewEvents, router])

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

      // Buscar lista do evento
      const { data: listData, error: listError } = await supabase
        .from("event_lists")
        .select(`
          *,
          list_types (name, color),
          sectors (name, color),
          users (name)
        `)
        .eq("id", listId)
        .eq("event_id", eventId)
        .single()

      if (listError) throw listError
      setEventList(listData)

      // Buscar convidados da lista
      const { data: guestsData, error: guestsError } = await supabase
        .from("guest_lists")
        .select("*")
        .eq("event_list_id", listId)
        .order("guest_name", { ascending: true })

      if (guestsError) throw guestsError
      setGuests(guestsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  // Filtros aplicados com useMemo para otimização
  const filteredGuests = useMemo(() => {
    let filtered = guests

    // Filtro por status de check-in
    if (statusFilter === "checked-in") {
      filtered = filtered.filter((guest) => guest.checked_in)
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((guest) => !guest.checked_in)
    }

    // Filtro por busca
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter((guest) => guest.guest_name.toLowerCase().includes(searchLower))
    }

    return filtered
  }, [guests, statusFilter, debouncedSearchTerm])

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
    pageSize: 20,
  })

  // Reset página quando filtros mudam
  useEffect(() => {
    resetPage()
  }, [statusFilter, debouncedSearchTerm, resetPage])

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

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Check-in realizado",
          details: `Check-in de "${guestName}" foi realizado na lista "${eventList?.name}"`,
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

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Check-in desfeito",
          details: `Check-in de "${guestName}" foi desfeito na lista "${eventList?.name}"`,
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

  const handleRemoveGuest = async (guestId: string, guestName: string) => {
    if (!confirm(`Tem certeza que deseja remover "${guestName}" da lista?`)) return

    try {
      const { error } = await supabase.from("guest_lists").delete().eq("id", guestId)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Convidado removido",
          details: `"${guestName}" foi removido da lista "${eventList?.name}"`,
        },
      ])

      toast.success(`${guestName} foi removido da lista`)
      fetchData()
    } catch (error) {
      console.error("Erro ao remover convidado:", error)
      toast.error("Erro ao remover convidado")
    }
  }

  const exportToCSV = () => {
    const csvData = filteredGuests.map((guest) => ({
      Nome: guest.guest_name,
      "Check-in": guest.checked_in ? "Sim" : "Não",
      "Data do Check-in": guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString("pt-BR") : "Não realizado",
      "Data de Criação": new Date(guest.created_at).toLocaleString("pt-BR"),
    }))

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lista-${eventList?.name}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
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
    return <Loading text="Carregando lista..." />
  }

  if (!event || !eventList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lista não encontrada</h1>
          <Link href="/events">
            <Button>Voltar para Eventos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const checkedInCount = filteredGuests.filter((g) => g.checked_in).length
  const totalGuests = filteredGuests.length
  const hasActiveFilters = statusFilter !== "all" || searchTerm.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.name, href: `/events/${event.id}` },
          { label: "Listas", href: `/events/${event.id}/lists` },
          { label: eventList.name },
        ]}
      />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{eventList.name}</h1>
          <p className="text-muted-foreground">
            <span className="font-medium">{event.name}</span> •{" "}
            {event.date ? new Date(event.date).toLocaleDateString("pt-BR") : "Data não definida"}
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventList.list_types?.color }} />
              <span className="text-sm text-muted-foreground">{eventList.list_types?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventList.sectors?.color }} />
              <span className="text-sm text-muted-foreground">{eventList.sectors?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link href={`/events/${eventId}/lists/${listId}/send`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Nomes
            </Button>
          </Link>
          <Link href={`/events/${eventId}/lists`}>
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">{hasActiveFilters ? "filtrados" : "nomes na lista"}</p>
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

        {eventList.max_capacity && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupação</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((guests.length / eventList.max_capacity) * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                {guests.length} de {eventList.max_capacity}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Convidados</span>
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
          <CardDescription>Gerencie os convidados desta lista</CardDescription>

          {/* Filtros */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4">
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

            <Button variant="outline" onClick={exportToCSV} className="h-12 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>

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
                      <div>Adicionado em: {new Date(guest.created_at).toLocaleDateString("pt-BR")}</div>
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

                    <div className="flex space-x-2">
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

                      {permissions.canManageEvents && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveGuest(guest.id, guest.guest_name)}
                          className="h-10 px-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
                  <TableHead>Check-in</TableHead>
                  <TableHead>Data de Adição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.guest_name}</TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(guest.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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

                        {permissions.canManageEvents && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveGuest(guest.id, guest.guest_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "Nenhum convidado encontrado" : "Nenhum convidado na lista"}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Adicione nomes à lista para começar."}
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
