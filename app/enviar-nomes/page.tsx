"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { supabase, type Event, type EventList } from "@/lib/supabase"
import { Send, RefreshCw, Users, Calendar, List, AlertCircle, CheckCircle, User } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"

interface FormData {
  event_id: string
  submission_type: "public" | "specific_list"
  list_id?: string
  names: string
  submitter_name: string
  submitter_phone: string
  submitter_email: string
}

export default function EnviarNomesPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [eventLists, setEventLists] = useState<EventList[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    event_id: "",
    submission_type: "public",
    list_id: "",
    names: "",
    submitter_name: user?.name || "",
    submitter_phone: "",
    submitter_email: user?.email || "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Preencher dados do usuário logado
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        submitter_name: user.name,
        submitter_email: user.email,
      }))
    }
  }, [user])

  useEffect(() => {
    if (formData.event_id && formData.submission_type === "specific_list") {
      fetchEventLists()
    } else {
      setEventLists([])
    }
  }, [formData.event_id, formData.submission_type])

  const fetchInitialData = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .order("date", { ascending: true })

      if (eventsError) throw eventsError

      setEvents(eventsData || [])
    } catch (error) {
      console.error("❌ Erro ao carregar dados iniciais:", error)
      toast.error("Erro ao carregar dados iniciais")
    } finally {
      setLoading(false)
    }
  }

  const fetchEventLists = async () => {
    if (!formData.event_id) return

    try {
      const { data: listsWithRelations, error: listsError } = await supabase
        .from("event_lists")
        .select(`
          *,
          list_types (id, name, color, is_active),
          sectors (id, name, color, is_active)
        `)
        .eq("event_id", formData.event_id)

      if (listsError) throw listsError

      const validLists =
        listsWithRelations?.filter((list) => {
          const isListActive = list.is_active === true
          const hasValidType = list.list_types && list.list_types.is_active === true
          const hasValidSector = list.sectors && list.sectors.is_active === true
          return isListActive && hasValidType && hasValidSector
        }) || []

      setEventLists(validLists)

      if (validLists.length > 0) {
        toast.success(
          `${validLists.length} lista${validLists.length > 1 ? "s" : ""} encontrada${validLists.length > 1 ? "s" : ""}`,
        )
      }
    } catch (error) {
      console.error("❌ Erro ao carregar listas:", error)
      toast.error("Erro ao carregar listas do evento")
      setEventLists([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validações
      if (!formData.event_id) {
        toast.error("Selecione um evento")
        return
      }

      if (formData.submission_type === "specific_list" && !formData.list_id) {
        toast.error("Selecione uma lista específica")
        return
      }

      if (!formData.names.trim()) {
        toast.error("Digite pelo menos um nome")
        return
      }

      if (!formData.submitter_name.trim()) {
        toast.error("Digite seu nome")
        return
      }

      // Processar nomes
      const namesList = formData.names
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name.length > 0)

      if (namesList.length === 0) {
        toast.error("Digite pelo menos um nome válido")
        return
      }

      // Preparar dados para submissão
      const submissionData = {
        event_id: formData.event_id,
        event_list_id: formData.submission_type === "specific_list" ? formData.list_id : null,
        names: namesList,
        submitter_name: formData.submitter_name,
        submitter_phone: formData.submitter_phone || null,
        submitter_email: formData.submitter_email || null,
        submission_type: formData.submission_type,
      }

      const { error } = await supabase.from("public_submissions").insert([submissionData])

      if (error) throw error

      toast.success(
        `${namesList.length} nome${namesList.length > 1 ? "s" : ""} enviado${namesList.length > 1 ? "s" : ""} com sucesso!`,
      )

      // Limpar formulário
      setFormData({
        event_id: "",
        submission_type: "public",
        list_id: "",
        names: "",
        submitter_name: user?.name || "",
        submitter_phone: "",
        submitter_email: user?.email || "",
      })
      setEventLists([])
    } catch (error) {
      console.error("❌ Erro ao enviar nomes:", error)
      toast.error("Erro ao enviar nomes. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefresh = () => {
    if (formData.event_id && formData.submission_type === "specific_list") {
      fetchEventLists()
    }
  }

  if (loading) {
    return <Loading text="Carregando formulário..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Enviar Lista de Nomes</h1>
          <p className="text-muted-foreground">Envie sua lista de nomes para os eventos da casa de show</p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum evento disponível</h3>
              <p className="text-muted-foreground">
                Não há eventos ativos no momento para envio de listas. Tente novamente mais tarde.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Formulário de Envio
                {user && (
                  <span className="ml-auto flex items-center text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-1" />
                    {user.name}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {user
                  ? "Seus dados foram preenchidos automaticamente. Escolha o destino e adicione a lista de nomes."
                  : "Preencha seus dados, escolha o destino e adicione a lista de nomes que deseja enviar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seleção do Evento */}
                <div className="space-y-2">
                  <Label htmlFor="event">Evento *</Label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, event_id: value, list_id: "" }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({new Date(event.date).toLocaleDateString("pt-BR")})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Submissão */}
                <div className="space-y-2">
                  <Label htmlFor="submission_type">Tipo de Envio *</Label>
                  <Select
                    value={formData.submission_type}
                    onValueChange={(value: "public" | "specific_list") =>
                      setFormData((prev) => ({ ...prev, submission_type: value, list_id: "" }))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <div>
                            <div>Lista Geral</div>
                            <div className="text-xs text-muted-foreground">Envio para análise da equipe</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="specific_list">
                        <div className="flex items-center space-x-2">
                          <List className="w-4 h-4" />
                          <div>
                            <div>Lista Específica</div>
                            <div className="text-xs text-muted-foreground">Envio direto para uma lista</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção da Lista Específica */}
                {formData.submission_type === "specific_list" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="list">Lista Específica *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={!formData.event_id}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>

                    {!formData.event_id ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Selecione um evento primeiro para ver as listas disponíveis</AlertDescription>
                      </Alert>
                    ) : eventLists.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Nenhuma lista disponível para este evento. Tente o envio geral.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Select
                        value={formData.list_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, list_id: value }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={`Selecione uma das ${eventLists.length} listas`} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: list.list_types?.color }}
                                />
                                <span>{list.name}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({list.list_types?.name} - {list.sectors?.name})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Lista de Nomes */}
                <div className="space-y-2">
                  <Label htmlFor="names" className="flex items-center justify-between">
                    <span>Lista de Nomes *</span>
                    {formData.names && (
                      <span className="text-sm text-muted-foreground">
                        {formData.names.split("\n").filter((name) => name.trim()).length} nomes
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id="names"
                    placeholder="Digite um nome por linha&#10;Exemplo:&#10;João Silva&#10;Maria Santos&#10;Pedro Oliveira"
                    value={formData.names}
                    onChange={(e) => setFormData((prev) => ({ ...prev, names: e.target.value }))}
                    className="min-h-[150px] text-base"
                    required
                  />
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Dica:</strong> Digite um nome por linha. Os nomes serão formatados automaticamente.
                    </p>
                  </div>
                </div>

                {/* Informações do Solicitante */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Suas Informações</h3>

                  <div className="space-y-2">
                    <Label htmlFor="submitter_name">Seu Nome *</Label>
                    <Input
                      id="submitter_name"
                      placeholder="Digite seu nome completo"
                      value={formData.submitter_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, submitter_name: e.target.value }))}
                      className={`h-12 text-base ${user ? "bg-muted/50" : ""}`}
                      readOnly={!!user}
                      required
                    />
                    {user && (
                      <p className="text-xs text-muted-foreground">Campo preenchido com seus dados de usuário</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="submitter_phone">Telefone</Label>
                      <Input
                        id="submitter_phone"
                        placeholder="(11) 99999-9999"
                        value={formData.submitter_phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, submitter_phone: e.target.value }))}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submitter_email">E-mail</Label>
                      <Input
                        id="submitter_email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.submitter_email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, submitter_email: e.target.value }))}
                        className={`h-12 text-base ${user ? "bg-muted/50" : ""}`}
                        readOnly={!!user}
                      />
                      {user && (
                        <p className="text-xs text-muted-foreground">Campo preenchido com seus dados de usuário</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Envio */}
                <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Lista de Nomes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Lista Geral:</strong> Seus nomes serão analisados pela equipe e distribuídos nas listas
                apropriadas conforme disponibilidade.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Lista Específica:</strong> Seus nomes serão enviados diretamente para a lista escolhida, sujeito
                à capacidade disponível.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Confirmação:</strong> Você receberá uma confirmação após o envio. A aprovação final depende da
                análise da equipe do evento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
