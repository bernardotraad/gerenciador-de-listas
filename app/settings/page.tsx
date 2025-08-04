"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loading } from "@/components/ui/loading"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Globe, Bell, Shield, Users } from "lucide-react"
import { toast } from "sonner"

const SettingsPage = () => {
  const { customUser } = useAuth()
  const permissions = usePermissions()
  const { settings, updateSettings, loading } = useSiteSettings()
  const [formData, setFormData] = useState({
    site_name: "",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    allow_public_submissions: true,
    require_approval: true,
    max_guests_per_submission: 10,
    enable_notifications: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (value: string) => {
    setFormData({ ...formData, site_name: value })
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateSettings(formData)
      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSwitchChange = (field: string, value: boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData({ ...formData, [field]: numValue })
  }

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        address: settings.address || "",
        allow_public_submissions: settings.allow_public_submissions,
        require_approval: settings.require_approval,
        max_guests_per_submission: settings.max_guests_per_submission,
        enable_notifications: settings.enable_notifications,
      })
    }
  }, [settings])

  if (!permissions.canManageSettings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para acessar as configurações.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="Carregando configurações..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>

        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>Configurações básicas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="site_name">Nome do Site</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Nome do seu sistema"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="site_description">Descrição do Site</Label>
              <Input
                id="site_description"
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                placeholder="Descrição do sistema"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contato@exemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefone de Contato</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Configurações de Submissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Configurações de Submissão
            </CardTitle>
            <CardDescription>Configure como os convidados podem ser enviados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Submissões Públicas</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que qualquer pessoa envie listas de convidados
                </p>
              </div>
              <Switch
                checked={formData.allow_public_submissions}
                onCheckedChange={(checked) => handleSwitchChange("allow_public_submissions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requer Aprovação</Label>
                <p className="text-sm text-muted-foreground">
                  Listas enviadas precisam ser aprovadas antes de serem aceitas
                </p>
              </div>
              <Switch
                checked={formData.require_approval}
                onCheckedChange={(checked) => handleSwitchChange("require_approval", checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max_guests">Máximo de Convidados por Submissão</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                max="100"
                value={formData.max_guests_per_submission}
                onChange={(e) => handleNumberChange("max_guests_per_submission", e.target.value)}
                placeholder="10"
              />
              <p className="text-sm text-muted-foreground">
                Número máximo de convidados que podem ser enviados de uma vez
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Configurações de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Configurações de Notificações
            </CardTitle>
            <CardDescription>Configure as notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações sobre novas submissões e eventos
                </p>
              </div>
              <Switch
                checked={formData.enable_notifications}
                onCheckedChange={(checked) => handleSwitchChange("enable_notifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>Informações sobre o sistema e usuário atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Usuário Atual</Label>
                <p className="text-sm text-muted-foreground">{customUser?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Função</Label>
                <p className="text-sm text-muted-foreground">
                  {customUser?.role === "admin" ? "Administrador" : customUser?.role === "portaria" ? "Portaria" : "Usuário"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Versão do Sistema</Label>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage
