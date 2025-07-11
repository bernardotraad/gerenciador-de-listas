"use client"

import { useAuth } from "@/lib/auth"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, CheckCircle, Clock, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalGuests: number
  checkedInGuests: number
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const { settings } = useSiteSettings()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalGuests: 0,
    checkedInGuests: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar estatísticas dos eventos
        const { data: events, error: eventsError } = await supabase.from("events").select("id, status")

        if (eventsError) {
          console.error("Erro ao buscar eventos:", eventsError)
          return
        }

        // Buscar estatísticas dos convidados
        const { data: guests, error: guestsError } = await supabase.from("guest_lists").select("id, checked_in")

        if (guestsError) {
          console.error("Erro ao buscar convidados:", guestsError)
          return
        }

        const totalEvents = events?.length || 0
        const activeEvents = events?.filter((e) => e.status === "active").length || 0
        const totalGuests = guests?.length || 0
        const checkedInGuests = guests?.filter((g) => g.checked_in).length || 0

        setStats({
          totalEvents,
          activeEvents,
          totalGuests,
          checkedInGuests,
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Bem-vindo ao {settings?.site_name || "Sistema de Gestão"}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sistema completo para gerenciamento de eventos, listas de convidados e check-ins
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto">
              <Button asChild size="lg" className="flex-1 h-12">
                <Link href="/enviar-nomes" className="flex items-center justify-center">
                  Enviar Lista de Nomes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 h-12 bg-transparent">
                <Link href="/login" className="flex items-center justify-center">
                  Fazer Login
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-primary" />
                <CardTitle>Gestão de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Crie e gerencie eventos com facilidade, definindo capacidade, setores e tipos de lista
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
                <CardTitle>Listas de Convidados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Organize convidados por setores e tipos de lista, com aprovação automática ou manual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-primary" />
                <CardTitle>Check-in Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Sistema de check-in rápido e eficiente com busca por nome, email ou telefone
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Olá, {user.name}! 👋</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle do {settings?.site_name || "Sistema de Gestão"}
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">{stats.activeEvents} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.activeEvents}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalGuests}</div>
              <p className="text-xs text-muted-foreground">Todos os eventos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.checkedInGuests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalGuests > 0
                  ? `${Math.round((stats.checkedInGuests / stats.totalGuests) * 100)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Evento
              </CardTitle>
              <CardDescription>Configure um novo evento com listas e setores</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/events">
                  Gerenciar Eventos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Check-in
              </CardTitle>
              <CardDescription>Realizar check-in de convidados nos eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/check-in">
                  Abrir Check-in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Listas de Convidados
              </CardTitle>
              <CardDescription>Visualizar e gerenciar todas as listas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/guest-lists">
                  Ver Listas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "Administrador" : user.role === "portaria" ? "Portaria" : "Usuário"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
