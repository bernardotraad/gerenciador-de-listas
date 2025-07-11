"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { supabase, type Event, type EventList } from "@/lib/supabase"
import { formatName } from "@/lib/utils"
import { Send, ArrowLeft, AlertCircle, User } from "lucide-react"
import { toast } from "sonner"

export default function SendToListPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventList, setEventList] = useState<EventList | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [guestNames, setGuestNames] = useState("")
  const [formData, setFormData] = useState({
    sender_name: "",
    sender_email: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id && params.listId) {
      fetchEventAndList()
    }
  }, [params.id, params.listId])

  // Preencher dados do usuário logado
  useEffect(() => {
    if (user) {
      setFormData({
        sender_name: user.name,
        sender_email: user.email,
      })
    }
  }, [user])

  const fetchEventAndList = async () => {
    try {
      // Buscar evento
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single()

      if (eventError) throw eventError

      // Buscar lista específica
      const { data: listData, error: listError } = await supabase
        .from("event_lists")
        .select(`
          *,
          list_types (name, color),
          sectors (name, color)
        `)
        .eq("id", params.listId)
        .eq("event_id", params.id)
        .single()

      if (listError) throw listError

      setEvent(eventData)
      setEventList(listData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar informações da lista")
      router.push("/events")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.sender_name.trim()) {
      newErrors.sender_name = "Nome é obrigatório"
    }

    if (!formData.sender_email.trim()) {
      newErrors.sender_email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.sender_email)) {
      newErrors.sender_email = "Email inválido"
    }

    if (!guestNames.trim()) {
      newErrors.guest_names = "Adicione pelo menos um nome"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitGuests = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário")
      return
    }

    setSubmitting(true)

    const namesArray = guestNames
      .split("\n")
      .map((name) => formatName(name.trim()))
      .filter((name) => name.length > 0)

    try {
      // Verificar capacidade máxima
      if (eventList?.max_capacity) {
        const { count: currentCount } = await supabase
          .from("guest_lists")
          .select("*", { count: "exact", head: true })
          .eq("event_list_id", params.listId)

        const totalAfterAdd = (currentCount || 0) + namesArray.length

        if (totalAfterAdd > eventList.max_capacity) {
          toast.error(
            `A lista "${eventList.name}" tem capacidade para ${eventList.max_capacity} pessoas. ` +
              `Atualmente há ${currentCount || 0} nomes. ` +
              `Você está tentando adicionar ${namesArray.length} nomes, ` +
              `o que excederia a capacidade em ${totalAfterAdd - eventList.max_capacity} pessoas.`,
          )
          setSubmitting(false)
          return
        }
      }

      // Preparar dados para inserção
      const guestsData = namesArray.map((name) => ({
        event_list_id: params.listId as string,
        guest_name: name,
        sender_name: formData.sender_name,
        sender_email: formData.sender_email,
        status: "approved", // Automaticamente aprovado
        submitted_by: user?.id || null,
      }))

      const { error } = await supabase.from("guest_lists").insert(guestsData)

      if (error) throw error

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user?.id || null,
          event_id: params.id as string,
          action: user ? "Lista de nomes enviada" : "Lista pública enviada",
          details: `${namesArray.length} nomes enviados para "${eventList?.name}" no evento "${event?.name}" por ${formData.sender_name} (${formData.sender_email})`,
        },
      ])

      toast.success(`${namesArray.length} nomes enviados com sucesso para a lista "${eventList?.name}"!`)

      // Limpar formulário
      setGuestNames("")
      setErrors({})

      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(`/events/${params.id}/lists/${params.listId}`)
      }, 2000)
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast.error("Erro inesperado ao enviar lista. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleGuestNamesChange = (value: string) => {
    setGuestNames(value)
    if (errors.guest_names) {
      setErrors((prev) => ({ ...prev, guest_names: "" }))
    }
  }

  const guestCount = guestNames.split("\n").filter((name) => name.trim().length > 0).length

  if (loading) {
    return <Loading text="Carregando informações da lista..." />
  }

  if (!event || !eventList) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Lista não encontrada</h3>
              <p className="text-muted-foreground mb-4">
                A lista solicitada não foi encontrada ou não está mais disponível.
              </p>
              <Button onClick={() => router.push("/events")}>Voltar aos Eventos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb />

        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/events/${params.id}/lists/${params.listId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a Lista
          </Button>

          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Enviar Nomes para Lista</h1>
            <p className="text-base md:text-lg text-muted-foreground">Adicione nomes diretamente à lista específica</p>
          </div>
        </div>

        {/* Informações da lista */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eventList.list_types?.color }} />
              <span>{eventList.name}</span>
            </CardTitle>
            <CardDescription>Você está enviando nomes para esta lista específica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>🎉 Evento:</strong> {event.name}
              </div>
              <div>
                <strong>📅 Data:</strong> {new Date(event.date).toLocaleDateString("pt-BR")}
              </div>
              <div>
                <strong>📋 Tipo:</strong> {eventList.list_types?.name}
              </div>
              <div>
                <strong>📍 Setor:</strong> {eventList.sectors?.name}
              </div>
              {eventList.max_capacity && (
                <div>
                  <strong>👥 Capacidade:</strong> {eventList.max_capacity} pessoas
                </div>
              )}
              {eventList.description && (
                <div className="md:col-span-2">
                  <strong>💬 Descrição:</strong> {eventList.description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Formulário de Envio
              {user && (
                <span className="ml-auto flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-1" />
                  Logado como {user.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {user
                ? "Seus dados foram preenchidos automaticamente. Adicione a lista de nomes."
                : "Preencha seus dados e adicione a lista de nomes que deseja enviar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitGuests} className="space-y-4 md:space-y-6">
              {/* Dados do remetente */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-medium flex items-center">
                  Seus Dados
                  {user && (
                    <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Preenchido automaticamente
                    </span>
                  )}
                </h3>
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender_name">
                      Seu Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sender_name"
                      name="sender_name"
                      placeholder="João Silva"
                      className={`h-12 text-base ${errors.sender_name ? "border-red-500" : ""} ${
                        user ? "bg-muted/50" : ""
                      }`}
                      value={formData.sender_name}
                      onChange={(e) => handleInputChange("sender_name", e.target.value)}
                      readOnly={!!user}
                      required
                    />
                    {errors.sender_name && <p className="text-sm text-red-500">{errors.sender_name}</p>}
                    {user && (
                      <p className="text-xs text-muted-foreground">Campo preenchido com seus dados de usuário</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender_email">
                      Seu Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sender_email"
                      name="sender_email"
                      type="email"
                      placeholder="joao@email.com"
                      className={`h-12 text-base ${errors.sender_email ? "border-red-500" : ""} ${
                        user ? "bg-muted/50" : ""
                      }`}
                      value={formData.sender_email}
                      onChange={(e) => handleInputChange("sender_email", e.target.value)}
                      readOnly={!!user}
                      required
                    />
                    {errors.sender_email && <p className="text-sm text-red-500">{errors.sender_email}</p>}
                    {user && (
                      <p className="text-xs text-muted-foreground">Campo preenchido com seus dados de usuário</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de nomes */}
              <div className="space-y-2">
                <Label htmlFor="guest_names" className="flex items-center justify-between">
                  <span>
                    Lista de Nomes <span className="text-red-500">*</span>
                  </span>
                  {guestCount > 0 && <span className="text-sm text-muted-foreground">{guestCount} nomes</span>}
                </Label>
                <Textarea
                  id="guest_names"
                  name="guest_names"
                  placeholder={`joão silva
maria santos
pedro oliveira
ana costa
carlos ferreira
fernanda lima
roberto alves
...`}
                  rows={12}
                  className={`resize-none text-base min-h-[300px] ${errors.guest_names ? "border-red-500" : ""}`}
                  value={guestNames}
                  onChange={(e) => handleGuestNamesChange(e.target.value)}
                  required
                />
                {errors.guest_names && <p className="text-sm text-red-500">{errors.guest_names}</p>}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Dica:</strong> Digite um nome por linha. Os nomes serão formatados automaticamente.
                    <br />
                    Exemplo: "joão silva" vira "João Silva", "maria DE santos" vira "Maria de Santos"
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/events/${params.id}/lists/${params.listId}`)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar {guestCount > 0 && `${guestCount} `}Nomes
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
