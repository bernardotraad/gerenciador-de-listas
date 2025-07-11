"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Calendar, Users, CheckCircle, BarChart3, ArrowRight, Plus } from "lucide-react"

interface Stats {
  totalEvents: number
  totalGuests: number
  totalCheckedIn: number
  activeEvents: number
}

export default function HomePage() {
  const { user } = useAuth()
  const { settings } = useSiteSettings()
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalGuests: 0,
    totalCheckedIn: 0,
    activeEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadStats = async () => {
    try {
      // Get events count
      const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true })

      // Get active events count
      const { count: activeEventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("date", new Date().toISOString().split("T")[0])

      // Get guests count
      const { count: guestsCount } = await supabase.from("guests").select("*", { count: "exact", head: true })

      // Get checked in count
      const { count: checkedInCount } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("checked_in", true)

      setStats({
        totalEvents: eventsCount || 0,
        totalGuests: guestsCount || 0,
        totalCheckedIn: checkedInCount || 0,
        activeEvents: activeEventsCount || 0,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao {settings?.site_name || "Sistema de Gestão"}</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 animate-pulse mb-1" />
                  <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
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
                  <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGuests}</div>
                  <p className="text-xs text-muted-foreground">Todas as listas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCheckedIn}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalGuests > 0 ? Math.round((stats.totalCheckedIn / stats.totalGuests) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalGuests > 0 ? Math.round((stats.totalCheckedIn / stats.totalGuests) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Check-ins vs convidados</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Acesse as funcionalidades mais utilizadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full justify-start">
                    <Link href="/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      Gerenciar Eventos
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="/check-in">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Realizar Check-in
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="/guest-lists">
                      <Users className="mr-2 h-4 w-4" />
                      Ver Listas de Convidados
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>Informações sobre o estado atual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sistema</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eventos Ativos</span>
                    <Badge variant={stats.activeEvents > 0 ? "default" : "secondary"}>{stats.activeEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Última Atualização</span>
                    <span className="text-sm text-muted-foreground">Agora</span>
                  </div>
                  <Separator />
                  <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                    <Link href="/logs">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Relatórios
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    )
  }

  // Public homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {settings?.site_name || "Sistema de Gestão"}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gerencie listas de convidados, realize check-ins e controle eventos de forma simples e eficiente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto mb-12">
            <Link href="/enviar-nomes" className="flex-1">
              <Button size="lg" className="w-full h-12 flex items-center justify-center">
                <Plus className="mr-2 h-4 w-4" />
                Enviar Lista de Nomes
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 flex items-center justify-center bg-transparent"
              >
                Fazer Login
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Gestão de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie e gerencie eventos com facilidade, definindo datas, locais e configurações específicas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Listas de Convidados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organize convidados em diferentes tipos de listas e setores para melhor controle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Check-in Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Realize check-ins rápidos e eficientes com busca inteligente e confirmação instantânea.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
