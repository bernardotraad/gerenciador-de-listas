"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, UserCheck, BarChart3, Plus, Clock, MapPin, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalGuests: number
  totalCheckIns: number
  recentEvents: any[]
  upcomingEvents: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalGuests: 0,
    totalCheckIns: 0,
    recentEvents: [],
    upcomingEvents: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas básicas
      const [eventsResult, guestsResult, checkInsResult] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("guest_list_entries").select("*", { count: "exact", head: true }),
        supabase.from("check_ins").select("*", { count: "exact", head: true }),
      ])

      const events = eventsResult.data || []
      const activeEvents = events.filter((e) => e.status === "active" || e.status === "published")

      // Eventos próximos (próximos 30 dias)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcomingEvents = events
        .filter((e) => new Date(e.date) >= now && new Date(e.date) <= thirtyDaysFromNow)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

      // Eventos recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentEvents = events
        .filter((e) => new Date(e.date) >= thirtyDaysAgo && new Date(e.date) <= now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setStats({
        totalEvents: events.length,
        activeEvents: activeEvents.length,
        totalGuests: guestsResult.count || 0,
        totalCheckIns: checkInsResult.count || 0,
        recentEvents,
        upcomingEvents,
      })
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Estado vazio - quando não há dados
  if (stats.totalEvents === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao sistema de gestão de eventos</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nenhum evento criado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nenhum evento ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nenhum convidado cadastrado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nenhum check-in realizado</p>
            </CardContent>
          </Card>
        </div>

        {/* Primeiros passos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Primeiros Passos
              </CardTitle>
              <CardDescription>Configure seu sistema e crie seu primeiro evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissions.canCreateEvents && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Criar Primeiro Evento</h4>
                    <p className="text-sm text-muted-foreground">Comece criando um evento</p>
                  </div>
                  <Link href="/events/create">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar
                    </Button>
                  </Link>
                </div>
              )}

              {permissions.canAccessSettings && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Configurar Sistema</h4>
                    <p className="text-sm text-muted-foreground">Personalize as configurações</p>
                  </div>
                  <Link href="/admin/settings">
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </Link>
                </div>
              )}

              {permissions.canManageUsers && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Gerenciar Usuários</h4>
                    <p className="text-sm text-muted-foreground">Adicione usuários ao sistema</p>
                  </div>
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recursos Disponíveis
              </CardTitle>
              <CardDescription>Explore todas as funcionalidades do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Gestão completa de eventos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Listas de convidados organizadas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Check-in rápido e eficiente</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Relatórios detalhados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Interface responsiva</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus eventos e estatísticas</p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{stats.activeEvents} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuests}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalGuests > 0 ? Math.round((stats.totalCheckIns / stats.totalGuests) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Eventos programados para os próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.name}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                        <MapPin className="w-3 h-3 ml-3 mr-1" />
                        {event.location}
                      </div>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum evento programado para os próximos 30 dias
              </p>
            )}
          </CardContent>
        </Card>

        {/* Eventos recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Eventos Recentes
            </CardTitle>
            <CardDescription>Eventos realizados nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.name}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                        <Badge variant="outline" className="ml-2">
                          {event.status === "completed" ? "Concluído" : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhum evento realizado nos últimos 30 dias</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
