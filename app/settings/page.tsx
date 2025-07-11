"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { useAuth } from "@/lib/auth"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { supabase } from "@/lib/supabase"
import { validateSiteName } from "@/lib/validation"
import { APP_CONFIG } from "@/lib/constants"
import { Settings, Save, Globe, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user } = useAuth()
  const { siteName, setSiteName, loading } = useSiteSettings()
  const router = useRouter()
  const [newSiteName, setNewSiteName] = useState("")
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState("")

  useEffect(() => {
    if (!loading) {
      setNewSiteName(siteName)
    }
  }, [siteName, loading])

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleInputChange = (value: string) => {
    setNewSiteName(value)

    // Validação em tempo real
    const validation = validateSiteName(value)
    setValidationError(validation.isValid ? "" : validation.error || "")
  }

  const handleSaveSiteName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const validation = validateSiteName(newSiteName)
    if (!validation.isValid) {
      setValidationError(validation.error || "")
      return
    }

    setSaving(true)

    try {
      await setSiteName(newSiteName.trim())

      // Log da atividade
      await supabase.from("activity_logs").insert([
        {
          user_id: user.id,
          action: "Configuração alterada",
          details: `Nome do site alterado para "${newSiteName.trim()}"`,
        },
      ])

      toast.success("Nome do site atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  if (user.role !== "admin") {
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    )
  }

  const isFormValid = !validationError && newSiteName.trim() !== siteName
  const characterCount = newSiteName.length

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb />

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais do sistema</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Configurações do Site
            </CardTitle>
            <CardDescription>Personalize as informações básicas do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSiteName} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site_name" className="flex items-center justify-between">
                  <span>Nome do Site</span>
                  <span
                    className={`text-xs ${
                      characterCount > APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH
                        ? "text-red-500"
                        : characterCount > APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH * 0.8
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {characterCount}/{APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH}
                  </span>
                </Label>
                <Input
                  id="site_name"
                  name="site_name"
                  placeholder="Casa de Show"
                  className={`h-12 text-base ${validationError ? "border-red-500" : ""}`}
                  value={newSiteName}
                  onChange={(e) => handleInputChange(e.target.value)}
                  maxLength={APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH}
                  required
                />

                {validationError ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{validationError}</span>
                  </div>
                ) : newSiteName.trim() && newSiteName.trim() !== siteName ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Nome válido</span>
                  </div>
                ) : null}

                <p className="text-sm text-muted-foreground">
                  Este nome aparecerá na barra de navegação e no título do navegador
                </p>
              </div>

              {newSiteName.trim() && newSiteName.trim() !== siteName && !validationError && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Prévia das mudanças:</h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div>
                      <strong>Navbar:</strong> {newSiteName}
                    </div>
                    <div>
                      <strong>Título do navegador:</strong> {newSiteName} - Listas
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base" disabled={saving || !isFormValid}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Detalhes técnicos e versão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Versão do Sistema:</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Nome atual:</span>
              <span className="text-muted-foreground font-mono">{siteName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Última atualização:</span>
              <span className="text-muted-foreground">{new Date().toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Administrador:</span>
              <span className="text-muted-foreground">{user.name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
