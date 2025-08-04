"use client"

import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  Calendar,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  FileText,
  Plus,
  Activity,
  Shield,
  UserCog,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalGuests: number
  checkedInGuests: number
  totalUsers: number
  recentActivity: number
}

const DashboardPage = () => {
  const { customUser, loading } = useAuth()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalGuests: 0,
    checkedInGuests: 0,
    totalUsers: 0,
    recentActivity: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchStats = async () => {
    try {
      // Buscar estatísticas básicas
      const [eventsResult, guestsResult, usersResult, activityResult] = await Promise.all([
        supabase.from("events").select("id, status"),
        supabase.from("guest_lists").select("id, checked_in"),
        supabase.from("users").select("id"),
        supabase
          .from("activity_logs")
          .select("id")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ])

      const events = eventsResult.data || []
      const guests = guestsResult.data || []
      const users = usersResult.data || []
      const activity = activityResult.data || []

      setStats({
        totalEvents: events.length,
        activeEvents: events.filter((e) => e.status === "active").length,
        totalGuests: guests.length,
        checkedInGuests: guests.filter((g) => g.checked_in).length,
        totalUsers: users.length,
        recentActivity: activity.length,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (customUser) {
      fetchStats()
    }
  }, [customUser])

  if (loading) {
    return <Loading text="Carregando dashboard..." />
  }

  if (!customUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você precisa estar logado para acessar o dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {customUser.name}
            <Badge variant="outline" className="ml-2">
              {customUser.role === "admin" ? "Administrador" : customUser.role === "portaria" ? "Portaria" : "Usuário"}
            </Badge>
          </p>
        </div>

        {permissions.canManageEvents && (
          <Link href="/events">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? "..." : stats.activeEvents} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalGuests}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? "..." : stats.checkedInGuests} confirmados</p>
          </CardContent>
        </Card>

        {permissions.canManageUsers && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários do Sistema</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">usuários cadastrados</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "..." : stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              Gerenciar Eventos
            </CardTitle>
            <CardDescription>Crie e gerencie eventos, configure listas de convidados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissions.canManageEvents ? (
              <>
                <Link href="/events">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Todos os Eventos
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo Evento
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Você não tem permissão para gerenciar eventos.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserCheck className="w-5 h-5" />
              Realizar Check-in
            </CardTitle>
            <CardDescription>Confirme a presença dos convidados nos eventos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissions.canCheckIn ? (
              <>
                <Link href="/check-in">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Fazer Check-in
                  </Button>
                </Link>
                <Link href="/guest-lists">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    Ver Listas de Convidados
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Você não tem permissão para fazer check-in.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              Ver Listas de Convidados
            </CardTitle>
            <CardDescription>Visualize e gerencie as listas de convidados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/guest-lists">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="w-4 h-4 mr-2" />
                Ver Todas as Listas
              </Button>
            </Link>
            {permissions.canSubmitGuests && (
              <Link href="/enviar-nomes">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar Nomes
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {permissions.canViewReports && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                Ver Relatórios
              </CardTitle>
              <CardDescription>Analise estatísticas e relatórios detalhados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios Gerais
                <Badge variant="secondary" className="ml-auto">
                  Em breve
                </Badge>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                <FileText className="w-4 h-4 mr-2" />
                Exportar Dados
                <Badge variant="secondary" className="ml-auto">
                  Em breve
                </Badge>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Section */}
      {permissions.isAdmin && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                Administração
              </CardTitle>
              <CardDescription>Ferramentas exclusivas para administradores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/users">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <UserCog className="w-4 h-4 mr-2" />
                    Gerenciar Usuários
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </Link>
                <Link href="/logs">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Logs do Sistema
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Sistema Online</p>
              <p className="text-sm text-muted-foreground">Todos os serviços funcionando</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Última Atualização</p>
              <p className="text-sm text-muted-foreground">Há poucos minutos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium">Versão</p>
              <p className="text-sm text-muted-foreground">v1.0.0 - Estável</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
