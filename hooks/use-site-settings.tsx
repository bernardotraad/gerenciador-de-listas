"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface SiteSettings {
  site_name: string
  site_description?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  allow_public_submissions: boolean
  require_approval: boolean
  max_guests_per_submission: number
  enable_notifications: boolean
}

interface SiteSettingsContextType {
  settings: SiteSettings | null
  siteName: string
  loading: boolean
  setSiteName: (name: string) => Promise<void>
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

const defaultSettings: SiteSettings = {
  site_name: "Sistema de Gestão",
  site_description: "Sistema de gerenciamento de eventos e listas",
  contact_email: "",
  contact_phone: "",
  address: "",
  logo_url: "",
  primary_color: "#000000",
  secondary_color: "#666666",
  allow_public_submissions: true,
  require_approval: true,
  max_guests_per_submission: 10,
  enable_notifications: false,
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value")

      if (error) {
        console.error("Erro ao buscar configurações:", error)
        return
      }

      if (data && data.length > 0) {
        // Converter array de configurações em objeto
        const settingsObj = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value
          return acc
        }, {} as any)

        // Converter strings para tipos apropriados
        const processedSettings: SiteSettings = {
          site_name: settingsObj.site_name || "Sistema de Gestão",
          site_description: settingsObj.site_description || "",
          contact_email: settingsObj.contact_email || "",
          contact_phone: settingsObj.contact_phone || "",
          address: settingsObj.address || "",
          logo_url: settingsObj.logo_url || "",
          primary_color: settingsObj.primary_color || "#000000",
          secondary_color: settingsObj.secondary_color || "#666666",
          allow_public_submissions: settingsObj.allow_public_submissions === "true",
          require_approval: settingsObj.require_approval === "true",
          max_guests_per_submission: Number.parseInt(settingsObj.max_guests_per_submission) || 10,
          enable_notifications: settingsObj.enable_notifications === "true",
        }

        setSettings(processedSettings)
      } else {
        // Configurações padrão se não houver dados
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      // Configurações padrão em caso de erro
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      // Converter objeto em array de configurações
      const settingsArray = Object.entries(newSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === "boolean" ? value.toString() : value?.toString() || "",
      }))

      // Atualizar cada configuração
      for (const setting of settingsArray) {
        const { error } = await supabase.from("site_settings").upsert(
          {
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
          },
          { onConflict: "setting_key" },
        )

        if (error) {
          console.error(`Erro ao atualizar configuração ${setting.setting_key}:`, error)
        }
      }

      // Recarregar configurações
      await fetchSettings()
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const setSiteName = async (name: string) => {
    await updateSettings({ site_name: name })
    setSettings((prev) => (prev ? { ...prev, site_name: name } : { ...defaultSettings, site_name: name }))
  }

  const value = {
    settings,
    siteName: settings?.site_name ?? "Sistema de Gestão",
    loading,
    setSiteName,
    updateSettings,
  }

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    // Retornar contexto padrão em vez de lançar erro
    return {
      settings: defaultSettings,
      siteName: defaultSettings.site_name,
      loading: false,
      setSiteName: async () => {},
      updateSettings: async () => {},
    }
  }
  return context
}
