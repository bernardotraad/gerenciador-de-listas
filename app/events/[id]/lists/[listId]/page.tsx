"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase, type EventList, type GuestList } from "@/lib/supabase"
import { usePagination } from "@/hooks/use-pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { groupGuestLists } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/constants"
import {
  Users,
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
} from "lucide-react"
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

  const [eventList, setEventList] = useState<EventList | null>(null)
  const [guestLists, setGuestLists] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.DEBOUNCE_DELAY)

  useEffect(() => {
    if (!permissions.canViewEvents) {
      router.replace("/dashboard")
      return
    }
    fetchData()
  }, [listId, permissions.canViewEvents, router])

  const fetchData = async () => {
    try {
      // Buscar dados da lista
      const { data: listData, error: listError } = await supabase
        .from("event_lists")
        .select(`
          *,
          events (name, date),
          list_types (name, color),
          sectors (name, color),
          users (name)
        `)
        .eq("id", listId)
        .single()

      if (listError) throw listError
      setEventList(listData)

      // Buscar convidados desta lista
      const { data: guestsData, error: guestsError } = await supabase
        .from("guest_lists")
        .select(`
          *,
          users (name, email)
        `)
        .eq("event_list_id", listId)
        .order("created_at", { ascending: false })

      if (guestsError) throw guestsError
      setGuestLists(guestsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  // Filtros aplicados com useMemo para otimização
  const filteredGuestLists = useMemo(() => {
    let filtered = guestLists

    // Filtro por busca
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (guest) =>
          guest.guest_name.toLowerCase().includes(searchLower) ||
          guest.users?.name?.toLowerCase().includes(searchLower) ||
          guest.sender_name?.toLowerCase().includes(searchLower) ||
          guest.sender_email?.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [guestLists, debouncedSearchTerm])

  // Agrupar listas filtradas
  const groupedLists = useMemo(() => {
    return groupGuestLists(filteredGuestLists)
  }, [filteredGuestLists])

  const { currentPage, totalPages, paginatedData, goToPage, totalItems, startIndex, endIndex, resetPage } =
    usePagination({
      data: groupedLists,
      pageSize: 10,
    })

  // Reset página quando filtros mudam
  useEffect(() => {
    resetPage()
  }, [debouncedSearchTerm, resetPage])

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

  if (!eventList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lista não encontrada</h1>
          <Link href={`/events/${eventId}/lists`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Listas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalGuests = filteredGuestLists.length
  const checkedInCount = filteredGuestLists.filter((g) => g.checked_in).length

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Eventos", href: "/events" },
          { label: eventList.events?.name || "Evento", href: `/events/${eventId}` },
          { label: "Listas", href: `/events/${eventId}/lists` },
          { label: eventList.name },
        ]}
      />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: eventList.list_types?.color }} />
            <h1 className="text-3xl font-bold">{eventList.name}</h1>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <p>
              <span className="font-medium">{eventList.events?.name}</span> •{" "}
              {eventList.events?.date && new Date(eventList.events.date).toLocaleDateString("pt-BR")}
            </p>
            <p>
              <span className="font-medium">Tipo:</span> {eventList.list_types?.name} •{" "}
              <span className="font-medium">Setor:</span> {eventList.sectors?.name}
            </p>
            {eventList.description && <p>{eventList.description}</p>}
          </div>
        </div>

        <div className="flex space-x-2">
          <Link href={`/events/${eventId}/lists/${listId}/send`}>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Enviar Nomes
            </Button>
          </Link>
          <Link href={`/events/${eventId}/lists`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas da lista */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">nomes na lista</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground">confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalGuests - checkedInCount}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">dos convidados</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacidade máxima */}
      {eventList.max_capacity && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ocupação da Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ocupação atual</span>
                <span>
                  {totalGuests}/{eventList.max_capacity}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${totalGuests >= eventList.max_capacity ? "bg-red-600" : "bg-blue-600"}`}
                  style={{
                    width: `${Math.min((totalGuests / eventList.max_capacity) * 100, 100)}%`,
                  }}
                />
              </div>
              {totalGuests >= eventList.max_capacity && (
                <p className="text-sm text-red-600 font-medium">⚠️ Lista lotada!</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Convidados da Lista</span>
            <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
              <span>
                {totalItems} {totalItems === 1 ? "envio" : "envios"}
              </span>
              <span>•</span>
              <span>
                {totalGuests} {totalGuests === 1 ? "convidado" : "convidados"}
              </span>
            </div>
          </CardTitle>
          <CardDescription>Nomes enviados para esta lista, organizados por remetente</CardDescription>

          {/* Busca */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou remetente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
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
                                    <div className="text-xs text-muted-foreground">
                                      Enviado em {new Date(guest.created_at).toLocaleDateString("pt-BR")}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {guest.checked_in ? (
                                      <div>
                                        <span className="text-green-600 font-medium text-sm">✓ Confirmado</span>
                                        {guest.checked_in_at && (
                                          <div className="text-xs text-muted-foreground">
                                            {new Date(guest.checked_in_at).toLocaleString("pt-BR")}
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
                                  <TableHead>Status</TableHead>
                                  <TableHead>Data de Envio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.guests.map((guest) => (
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
                                        <span className="text-orange-600">Pendente</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {new Date(guest.created_at).toLocaleDateString("pt-BR")}
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
              <h3 className="text-lg font-medium mb-2">Nenhum nome na lista</h3>
              <p className="text-muted-foreground mb-4">Envie os primeiros nomes para esta lista.</p>
              <Link href={`/events/${eventId}/lists/${listId}/send`}>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Nomes
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
