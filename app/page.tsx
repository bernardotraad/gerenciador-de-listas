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

const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  href 
}: { 
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}) => {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} aria-label={`Ver ${title.toLowerCase()}`}>
        {content}
      </Link>
    )
  }

  return content
}

const LoadingSkeleton = () => (
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
)

const GuestSubmissionSection = ({ settings }: { settings: any }) => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Envie seu nome para eventos</h2>
    <p className="text-muted-foreground mb-6">
      Faça parte dos nossos eventos! Envie seu nome para ser incluído nas listas de convidados.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button asChild size="lg">
        <Link href="/enviar-nomes" aria-label="Enviar nome para eventos">
          Enviar Nome
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg">
        <Link href="/guest-lists" aria-label="Ver listas de convidados">
          Ver Listas
        </Link>
      </Button>
    </div>
  </div>
)

const DashboardSection = ({ 
  stats, 
  settings 
}: { 
  stats: Stats
  settings: any 
}) => (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo ao {settings?.site_name || "Sistema de Gestão"}
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Total de Eventos"
        value={stats.totalEvents}
        description="Eventos criados"
        icon={Calendar}
        href="/events"
      />
      <StatsCard
        title="Eventos Ativos"
        value={stats.activeEvents}
        description="Eventos futuros"
        icon={BarChart3}
        href="/events"
      />
      <StatsCard
        title="Total de Convidados"
        value={stats.totalGuests}
        description="Pessoas cadastradas"
        icon={Users}
        href="/guest-lists"
      />
      <StatsCard
        title="Check-ins"
        value={stats.totalCheckedIn}
        description="Convidados presentes"
        icon={CheckCircle}
        href="/check-in"
      />
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full justify-start">
            <Link href="/events/new" aria-label="Criar novo evento">
              <Plus className="mr-2 h-4 w-4" />
              Criar Evento
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/guest-lists" aria-label="Gerenciar listas">
              <Users className="mr-2 h-4 w-4" />
              Gerenciar Listas
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href="/check-in" aria-label="Fazer check-in">
              <CheckCircle className="mr-2 h-4 w-4" />
              Check-in
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gestão</CardTitle>
          <CardDescription>
            {settings?.site_name || "Sistema de Gestão"} - Plataforma completa para gerenciamento de eventos e listas de convidados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Versão</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="default">Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

const HomePage = () => {
  const { user } = useAuth()
  const { settings } = useSiteSettings()
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalGuests: 0,
    totalCheckedIn: 0,
    activeEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  const handleLoadStats = async () => {
    try {
      const [eventsResult, activeEventsResult, guestsResult, checkedInResult] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .gte("date", new Date().toISOString().split("T")[0]),
        supabase.from("guests").select("*", { count: "exact", head: true }),
        supabase
          .from("guests")
          .select("*", { count: "exact", head: true })
          .eq("checked_in", true),
      ])

      setStats({
        totalEvents: eventsResult.count || 0,
        totalGuests: guestsResult.count || 0,
        totalCheckedIn: checkedInResult.count || 0,
        activeEvents: activeEventsResult.count || 0,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      handleLoadStats()
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!user) {
    return <GuestSubmissionSection settings={settings} />
  }

  return <DashboardSection stats={stats} settings={settings} />
}

export default HomePage
