"use client"

import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Users,
  Settings,
  FileText,
  BarChart3,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"

const AdminPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()

  if (!permissions.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para acessar o painel administrativo.</p>
        </div>
      </div>
    )
  }

  if (!customUser) {
    return <Loading text="Carregando..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {customUser.name}. Gerencie o sistema através das ferramentas abaixo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Gerenciamento de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>Crie, edite e gerencie usuários do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/users">
              <Button className="w-full justify-start" tabIndex={0}>
                <Users className="w-4 h-4 mr-2" />
                Ver Todos os Usuários
              </Button>
            </Link>
            <Link href="/users">
              <Button variant="outline" className="w-full justify-start bg-transparent" tabIndex={0}>
                <Shield className="w-4 h-4 mr-2" />
                Gerenciar Permissões
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações
            </CardTitle>
            <CardDescription>Configure o sistema e suas preferências</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/settings">
              <Button className="w-full justify-start" tabIndex={0}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações Gerais
              </Button>
            </Link>
            <Link href="/admin/list-types">
              <Button variant="outline" className="w-full justify-start bg-transparent" tabIndex={0}>
                <FileText className="w-4 h-4 mr-2" />
                Tipos de Lista
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Relatórios e Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Relatórios
            </CardTitle>
            <CardDescription>Visualize estatísticas e relatórios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" disabled aria-label="Relatórios gerais - em breve">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios Gerais
              <Badge variant="secondary" className="ml-auto">
                Em breve
              </Badge>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" disabled aria-label="Analytics - em breve">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
              <Badge variant="secondary" className="ml-auto">
                Em breve
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Logs do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Logs do Sistema
            </CardTitle>
            <CardDescription>Visualize logs de atividades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/logs">
              <Button className="w-full justify-start" tabIndex={0}>
                <FileText className="w-4 h-4 mr-2" />
                Ver Logs
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start bg-transparent" disabled aria-label="Backup de dados - em breve">
              <Database className="w-4 h-4 mr-2" />
              Backup de Dados
              <Badge variant="secondary" className="ml-auto">
                Em breve
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Monitoramento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Monitoramento
            </CardTitle>
            <CardDescription>Status e saúde do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status do Sistema</span>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Última Verificação</span>
              <span className="text-sm text-muted-foreground">Agora</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Versão</span>
              <span className="text-sm text-muted-foreground">v1.0.0</span>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas
            </CardTitle>
            <CardDescription>Notificações e alertas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo</p>
            </div>
            <Button variant="outline" className="w-full bg-transparent" disabled aria-label="Histórico de alertas - em breve">
              <Clock className="w-4 h-4 mr-2" />
              Histórico de Alertas
              <Badge variant="secondary" className="ml-auto">
                Em breve
              </Badge>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Estatísticas Rápidas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">eventos em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">registros de atividade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">tempo de atividade</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
