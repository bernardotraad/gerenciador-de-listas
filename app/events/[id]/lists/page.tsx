"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { usePagination } from "@/hooks/use-pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { supabase, type Event, type EventList, type ListType, type Sector } from "@/lib/supabase"
import { APP_CONFIG } from "@/lib/constants"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Clock,
  Filter,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function EventListsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [listTypes, setListTypes] = useState<ListType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sectorFilter, setSectorFilter] = useState<string>("all")

  // Estados para o modal de criação/edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<EventList | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    list_type_id: "",
    sector_id: "",
    max_capacity: "",
  })

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.DEBOUNCE_DELAY)

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

      // Buscar listas do evento
      const { data: listsData, error: listsError } = await supabase
        .from("event_lists")
        .select(`
          *,
          list_types (name, color),
          sectors (name, color),
          users (name),
          guest_lists (id, checked_in)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (listsError) throw listsError
      setEventLists(listsData || [])

      // Buscar tipos de lista
      const { data: typesData, error: typesError } = await supabase.from("list_types").select("*").order("name")

      if (typesError) throw typesError
      setListTypes(typesData || [])

      // Buscar setores
      const { data: sectorsData, error: sectorsError } = await supabase.from("sectors").select("*").order("name")

      if (sectorsError) throw sectorsError
      setSectors(sectorsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  // Filtros aplicados com useMemo para otimização
  const filteredEventLists = useMemo(() => {
    let filtered = eventLists

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((list) => list.list_type_id === typeFilter)
    }

    // Filtro por setor
    if (sectorFilter !== "all") {
      filtered = filtered.filter((list) => list.sector_id === sectorFilter)
    }

    // Filtro por busca
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (list) =>
          list.name.toLowerCase().includes(searchLower) ||
          list.description?.toLowerCase().includes(searchLower) ||
          list.list_types?.name.toLowerCase().includes(searchLower) ||
          list.sectors?.name.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [eventLists, typeFilter, sectorFilter, debouncedSearchTerm])

  const { currentPage, totalPages, paginatedData, goToPage, totalItems, startIndex, endIndex, resetPage } =
    usePagination({
      data: filteredEventLists,
      pageSize: 10,
    })

  // Reset página quando filtros mudam
  useEffect(() => {
    resetPage()
  }, [typeFilter, sectorFilter, debouncedSearchTerm, resetPage])

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase.from("event_lists").insert([
        {
          event_id: eventId,
          name: formData.name,
          description: formData.description || null,
          list_type_id: formData.list_type_id,
          sector_id: formData.sector_id,
          max_capacity: formData.max_capacity ? Number.parseInt(formData.max_capacity) : null,
          created_by: user!.id,
        },
      ])

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Lista criada",
          details: `Lista "${formData.name}" foi criada`,
        },
      ])

      toast.success("Lista criada com sucesso!")
      setIsCreateModalOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Erro ao criar lista:", error)
      toast.error("Erro ao criar lista")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingList) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from("event_lists")
        .update({
          name: formData.name,
          description: formData.description || null,
          list_type_id: formData.list_type_id,
          sector_id: formData.sector_id,
          max_capacity: formData.max_capacity ? Number.parseInt(formData.max_capacity) : null,
        })
        .eq("id", editingList.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Lista editada",
          details: `Lista "${formData.name}" foi editada`,
        },
      ])

      toast.success("Lista atualizada com sucesso!")
      setIsEditModalOpen(false)
      setEditingList(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Erro ao editar lista:", error)
      toast.error("Erro ao editar lista")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteList = async (list: EventList) => {
    try {
      // Verificar se há convidados na lista
      const { data: guests, error: guestsError } = await supabase
        .from("guest_lists")
        .select("id")
        .eq("event_list_id", list.id)

      if (guestsError) throw guestsError

      if (guests && guests.length > 0) {
        toast.error("Não é possível excluir uma lista que possui convidados")
        return
      }

      const { error } = await supabase.from("event_lists").delete().eq("id", list.id)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user!.id,
          event_id: eventId,
          action: "Lista excluída",
          details: `Lista "${list.name}" foi excluída`,
        },
      ])

      toast.success("Lista excluída com sucesso!")
      fetchData()
    } catch (error) {
      console.error("Erro ao excluir lista:", error)
      toast.error("Erro ao excluir lista")
    }
  }

  const openEditModal = (list: EventList) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      description: list.description || "",
      list_type_id: list.list_type_id,
      sector_id: list.sector_id,
      max_capacity: list.max_capacity?.toString() || "",
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      list_type_id: "",
      sector_id: "",
      max_capacity: "",
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setSectorFilter("all")
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
    return <Loading text="Carregando listas..." />
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

  const totalGuests = eventLists.reduce((sum, list) => sum + (list.guest_lists?.length || 0), 0)
  const checkedInGuests = eventLists.reduce(
    (sum, list) => sum + (list.guest_lists?.filter((g) => g.checked_in).length || 0),
    0,
  )
  const hasActiveFilters = typeFilter !== "all" || sectorFilter !== "all" || searchTerm.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Eventos", href: "/events" },
          { label: event.name, href: `/events/${event.id}` },
          { label: "Listas" },
        ]}
      />

      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <div className="flex items-center space-x-4 text-muted-foreground mt-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{event.date ? new Date(event.date).toLocaleDateString("pt-BR") : "Data não definida"}</span>
            </div>
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{event.users?.name || "Organizador não definido"}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {permissions.canManageEvents && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Lista
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateList}>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Lista</DialogTitle>
                    <DialogDescription>Crie uma nova lista de convidados para este evento.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Nome
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="list_type" className="text-right">
                        Tipo
                      </Label>
                      <Select
                        value={formData.list_type_id}
                        onValueChange={(value) => setFormData({ ...formData, list_type_id: value })}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {listTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sector" className="text-right">
                        Setor
                      </Label>
                      <Select
                        value={formData.sector_id}
                        onValueChange={(value) => setFormData({ ...formData, sector_id: value })}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                                <span>{sector.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="max_capacity" className="text-right">
                        Capacidade
                      </Label>
                      <Input
                        id="max_capacity"
                        type="number"
                        value={formData.max_capacity}
                        onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                        className="col-span-3"
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Descrição
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="col-span-3"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Criando..." : "Criar Lista"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Link href={`/events/${eventId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas do evento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventLists.length}</div>
            <p className="text-xs text-muted-foreground">listas criadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
            <p className="text-xs text-muted-foreground">nomes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInGuests}</div>
            <p className="text-xs text-muted-foreground">confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests - checkedInGuests}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listas do Evento</span>
            <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
              <span>
                {totalItems} {totalItems === 1 ? "lista" : "listas"}
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
          <CardDescription>Gerencie as listas de convidados deste evento</CardDescription>

          {/* Filtros */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-12">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {listTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-12">
                <SelectValue placeholder="Filtrar por setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                      <span>{sector.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar listas..."
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
          <div className="block md:hidden space-y-4">
            {paginatedData.map((list) => {
              const guestCount = list.guest_lists?.length || 0
              const checkedInCount = list.guest_lists?.filter((g) => g.checked_in).length || 0

              return (
                <Card key={list.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.list_types?.color }} />
                          <h3 className="font-medium text-lg">{list.name}</h3>
                        </div>
                        {list.description && <p className="text-sm text-muted-foreground mb-2">{list.description}</p>}
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <span className="font-medium">Tipo:</span> {list.list_types?.name}
                          </div>
                          <div>
                            <span className="font-medium">Setor:</span> {list.sectors?.name}
                          </div>
                          {list.max_capacity && (
                            <div>
                              <span className="font-medium">Capacidade:</span> {guestCount}/{list.max_capacity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{guestCount}</div>
                        <div className="text-xs text-muted-foreground">convidados</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{checkedInCount}</div>
                        <div className="text-xs text-muted-foreground">confirmados</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/events/${eventId}/lists/${list.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-transparent">
                          Ver Lista
                        </Button>
                      </Link>
                      {permissions.canManageEvents && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(list)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Lista</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a lista "{list.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteList(list)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Versão desktop - Tabela */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Lista</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Convidados</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((list) => {
                  const guestCount = list.guest_lists?.length || 0
                  const checkedInCount = list.guest_lists?.filter((g) => g.checked_in).length || 0

                  return (
                    <TableRow key={list.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{list.name}</div>
                          {list.description && <div className="text-sm text-muted-foreground">{list.description}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.list_types?.color }} />
                          <span>{list.list_types?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.sectors?.color }} />
                          <span>{list.sectors?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{guestCount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{checkedInCount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {list.max_capacity ? (
                          <div className="text-center">
                            <div className="font-medium">
                              {guestCount}/{list.max_capacity}
                            </div>
                            {guestCount >= list.max_capacity && <div className="text-xs text-red-600">Lotada</div>}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">Ilimitada</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/events/${eventId}/lists/${list.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Lista
                            </Button>
                          </Link>
                          {permissions.canManageEvents && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditModal(list)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Lista</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a lista "{list.name}"? Esta ação não pode ser
                                      desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteList(list)}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

          {filteredEventLists.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? "Nenhuma lista encontrada" : "Nenhuma lista criada"}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Crie a primeira lista de convidados para este evento."}
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

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditList}>
            <DialogHeader>
              <DialogTitle>Editar Lista</DialogTitle>
              <DialogDescription>Edite as informações da lista de convidados.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-list_type" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={formData.list_type_id}
                  onValueChange={(value) => setFormData({ ...formData, list_type_id: value })}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {listTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sector" className="text-right">
                  Setor
                </Label>
                <Select
                  value={formData.sector_id}
                  onValueChange={(value) => setFormData({ ...formData, sector_id: value })}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                          <span>{sector.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-max_capacity" className="text-right">
                  Capacidade
                </Label>
                <Input
                  id="edit-max_capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
