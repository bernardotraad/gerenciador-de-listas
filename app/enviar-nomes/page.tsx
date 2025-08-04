"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Event {
  id: string
  name: string
  date: string
  status: string
}

interface ListType {
  id: string
  name: string
  description: string
}

interface Sector {
  id: string
  name: string
  description: string
}

const EnviarNomesPage = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [listTypes, setListTypes] = useState<ListType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    event_id: "",
    list_type_id: "",
    sector_id: "",
    guest_names: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  })

  const handleLoadData = async () => {
    try {
      const [eventsResult, listTypesResult, sectorsResult] = await Promise.all([
        supabase.from("events").select("*").eq("status", "active").order("date", { ascending: true }),
        supabase.from("list_types").select("*").order("name", { ascending: true }),
        supabase.from("sectors").select("*").order("name", { ascending: true }),
      ])

      if (eventsResult.error) throw eventsResult.error
      if (listTypesResult.error) throw listTypesResult.error
      if (sectorsResult.error) throw sectorsResult.error

      setEvents(eventsResult.data || [])
      setListTypes(listTypesResult.data || [])
      setSectors(sectorsResult.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const namesArray = formData.guest_names
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name.length > 0)

      if (namesArray.length === 0) {
        toast.error("Por favor, insira pelo menos um nome")
        return
      }

      if (namesArray.length > 50) {
        toast.error("Máximo de 50 nomes por envio")
        return
      }

      const guestData = namesArray.map((name) => ({
        name,
        event_id: formData.event_id,
        list_type_id: formData.list_type_id,
        sector_id: formData.sector_id,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        submitted_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("guest_lists").insert(guestData)

      if (error) throw error

      toast.success(`${namesArray.length} nome(s) enviado(s) com sucesso!`)
      setFormData({
        event_id: "",
        list_type_id: "",
        sector_id: "",
        guest_names: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
      })
    } catch (error: any) {
      console.error("Erro ao enviar nomes:", error)
      toast.error(error.message || "Erro ao enviar nomes")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefresh = () => {
    handleLoadData()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleGetNameCount = () => {
    return formData.guest_names
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0).length
  }

  useEffect(() => {
    handleLoadData()
  }, [])

  if (loading) {
    return <Loading text="Carregando formulário..." />
  }

  const nameCount = handleGetNameCount()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Enviar Lista de Nomes</h1>
          <p className="text-muted-foreground">
            Envie a lista de convidados para um evento específico
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Formulário de Envio
            </CardTitle>
            <CardDescription>
              Preencha as informações abaixo para enviar sua lista de convidados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Evento */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_id">Evento *</Label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => handleInputChange("event_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {new Date(event.date).toLocaleDateString("pt-BR")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="list_type_id">Tipo de Lista *</Label>
                  <Select
                    value={formData.list_type_id}
                    onValueChange={(value) => handleInputChange("list_type_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {listTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seleção de Setor */}
              <div className="space-y-2">
                <Label htmlFor="sector_id">Setor *</Label>
                <Select
                  value={formData.sector_id}
                  onValueChange={(value) => handleInputChange("sector_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Lista de Nomes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="guest_names">Lista de Nomes *</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{nameCount} nome(s)</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      aria-label="Recarregar dados"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="guest_names"
                  placeholder="Digite um nome por linha:&#10;João Silva&#10;Maria Santos&#10;Pedro Oliveira"
                  value={formData.guest_names}
                  onChange={(e) => handleInputChange("guest_names", e.target.value)}
                  className="min-h-[200px]"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Digite um nome por linha. Máximo de 50 nomes por envio.
                </p>
              </div>

              <Separator />

              {/* Informações de Contato */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações de Contato</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Nome do Contato</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange("contact_name", e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Telefone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Importantes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Informações Importantes</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Os nomes serão adicionados à lista do evento selecionado</li>
                      <li>• Verifique se o tipo de lista e setor estão corretos</li>
                      <li>• Máximo de 50 nomes por envio</li>
                      <li>• Os nomes serão verificados antes da aprovação</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {nameCount > 0 && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{nameCount} nome(s) pronto(s) para envio</span>
                    </>
                  )}
                </div>
                <Button type="submit" disabled={submitting || nameCount === 0}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Enviar Lista
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EnviarNomesPage
