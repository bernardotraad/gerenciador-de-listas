"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { CheckCircle, Search, User, Calendar, MapPin, X, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface GuestList {
  id: string
  name: string
  event_name: string
  event_date: string
  list_type: string
  sector: string
  checked_in: boolean
  checked_in_at?: string
  checked_in_by?: string
}

const CheckInPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const [guests, setGuests] = useState<GuestList[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<GuestList | null>(null)

  const handleLoadGuests = async () => {
    try {
      const { data, error } = await supabase
        .from("guest_lists")
        .select(`
          id,
          name,
          checked_in,
          checked_in_at,
          checked_in_by,
          events!inner(name, date),
          list_types!inner(name),
          sectors!inner(name)
        `)
        .order("name", { ascending: true })

      if (error) throw error

      const formattedGuests = data?.map((guest) => ({
        id: guest.id,
        name: guest.name,
        event_name: guest.events?.name || "Evento não encontrado",
        event_date: guest.events?.date || "",
        list_type: guest.list_types?.name || "Tipo não encontrado",
        sector: guest.sectors?.name || "Setor não encontrado",
        checked_in: guest.checked_in || false,
        checked_in_at: guest.checked_in_at,
        checked_in_by: guest.checked_in_by,
      })) || []

      setGuests(formattedGuests)
    } catch (error) {
      console.error("Erro ao carregar convidados:", error)
      toast.error("Erro ao carregar convidados")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from("guest_lists")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: customUser?.id,
        })
        .eq("id", guestId)

      if (error) throw error

      toast.success("Check-in realizado com sucesso!")
      handleLoadGuests()
    } catch (error: any) {
      console.error("Erro ao fazer check-in:", error)
      toast.error(error.message || "Erro ao fazer check-in")
    }
  }

  const handleCheckOut = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from("guest_lists")
        .update({
          checked_in: false,
          checked_in_at: null,
          checked_in_by: null,
        })
        .eq("id", guestId)

      if (error) throw error

      toast.success("Check-out realizado com sucesso!")
      handleLoadGuests()
    } catch (error: any) {
      console.error("Erro ao fazer check-out:", error)
      toast.error(error.message || "Erro ao fazer check-out")
    }
  }

  const handleFilterGuests = () => {
    return guests.filter((guest) =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.list_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.sector.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleGetEventDate = (guest: GuestList) => {
    if (!guest.event_date) return "Data não definida"
    return new Date(guest.event_date).toLocaleDateString("pt-BR")
  }

  const handleClearFilters = () => {
    setSearchTerm("")
  }

  useEffect(() => {
    if (customUser) {
      handleLoadGuests()
    }
  }, [customUser])

  if (!permissions.canCheckIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para realizar check-ins.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando convidados..." />
  }

  const filteredGuests = handleFilterGuests()
  const checkedInCount = guests.filter((guest) => guest.checked_in).length
  const totalCount = guests.length

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Check-in</h1>
        <p className="text-muted-foreground">Realize check-ins dos convidados</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total de Convidados</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Check-ins Realizados</p>
                <p className="text-2xl font-bold">{checkedInCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Taxa de Conversão</p>
                <p className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}%
                </p>
              </div>
              <Check className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Convidados</CardTitle>
          <CardDescription>Busque e realize check-ins dos convidados</CardDescription>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, evento, tipo ou setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={handleClearFilters} aria-label="Limpar filtros">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  guest.checked_in ? "bg-green-50 border-green-200" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">{guest.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{guest.event_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{guest.sector}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={guest.checked_in ? "default" : "secondary"}>
                    {guest.list_type}
                  </Badge>
                  {guest.checked_in ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Check-in Realizado
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckOut(guest.id)}
                        aria-label={`Fazer check-out de ${guest.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCheckIn(guest.id)}
                      aria-label={`Fazer check-in de ${guest.name}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check-in
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredGuests.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum convidado encontrado para a busca." : "Nenhum convidado cadastrado."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CheckInPage
