"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Loading } from "@/components/ui/loading"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { supabase } from "@/lib/supabase"
import { Users, Settings, BarChart3, FileText, Palette, MapPin, Shield, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  totalEvents: number
  totalGuests: number
  totalLogs: number
  totalTypes: number
  totalSectors: number
}

export default function AdminPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && !permissions.canManageUsers) {
      router.replace("/dashboard")
    }
  }, [user, permissions.canManageUsers, router])

  useEffect(() => {
    if (permissions.canManageUsers) {
      fetchStats()
    }
  }, [permissions.canManageUsers])

  const fetchStats = async () => {
    try {
      const [usersResult, eventsResult, guestsResult, logsResult, typesResult, sectorsResult] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("guest_lists").select("*", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }),
        supabase.from("list_types").select("*", { count: "exact", head: true }),
        supabase.from("sectors").select("*", { count: "exact", head: true }),
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalGuests: guestsResult.count || 0,
        totalLogs: logsResult.count || 0,
        totalTypes: typesResult.count || 0,
        totalSectors: sectorsResult.count || 0,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!permissions.canManageUsers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando painel administrativo..." />
  }

  const adminCards = [
    {
      title: "Gerenciar Usuários",
      description: "Criar, editar e gerenciar usuários do sistema",
      icon: Users,
      href: "/users",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      stat: stats?.totalUsers || 0,
      statLabel: "usuários cadastrados",
    },
    {
      title: "Configurações do Site",
      description: "Alterar título, descrição e informações gerais",
      icon: Settings,
      href: "/settings",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      stat: null,
      statLabel: "configurações",
    },
    {
      title: "Tipos de Lista",
      description: "Gerenciar tipos de lista (VIP, Desconto, etc.)",
      icon: Palette,
      href: "/admin/list-types",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      stat: stats?.totalTypes || 0,
      statLabel: "tipos configurados",
    },
    {
      title: "Setores",
      description: "Gerenciar setores do evento (Pista, Camarote, etc.)",
      icon: MapPin,
      href: "/admin/list-types",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      stat: stats?.totalSectors || 0,
      statLabel: "setores configurados",
    },
    {
      title: "Logs de Atividade",
      description: "Visualizar histórico de ações no sistema",
      icon: Activity,
      href: "/logs",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      stat: stats?.totalLogs || 0,
      statLabel: "atividades registradas",
    },
    {
      title: "Relatórios",
      description: "Relatórios detalhados de eventos e convidados",
      icon: FileText,
      href: "/guest-lists",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      stat: stats?.totalGuests || 0,
      statLabel: "convidados cadastrados",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb />

      <div className="mb-6 md:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold">Painel Administrativo</h1>
        </div>
        <p className="text-muted-foreground">Central de administração do sistema de gestão de eventos</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">eventos criados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGuests || 0}</div>
            <p className="text-xs text-muted-foreground">nomes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">logs registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Administração */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="text-lg">{card.title}</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm">{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {card.stat !== null && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{card.stat}</div>
                        <div className="text-xs text-muted-foreground">{card.statLabel}</div>
                      </div>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">→</div>
                    </div>
                  )}
                  {card.stat === null && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Acessar configurações</div>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">→</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Aviso se não há dados */}
      {stats && Object.values(stats).every((val) => val === 0) && (
        <Card className="mt-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">Sistema Vazio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 dark:text-orange-300">
              O sistema parece estar vazio. Comece criando alguns eventos e configurando os tipos de lista e setores.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
