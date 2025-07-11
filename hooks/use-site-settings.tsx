"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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

const defaultSettings: SiteSettings = {
  site_name: "Sistema de Gestão",
  site_description: "Sistema de gerenciamento de eventos e listas",
  contact_email: "",
  contact_phone: "",
  address: "",
  logo_url: "",
  primary_color: "#3b82f6",
  secondary_color: "#64748b",
  allow_public_submissions: true,
  require_approval: true,
  max_guests_per_submission: 10,
  enable_notifications: false,
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value")

      if (error) throw error

      if (data && data.length > 0) {
        const settingsObj: any = {}
        data.forEach((item) => {
          settingsObj[item.setting_key] = item.setting_value
        })

        setSettings({
          site_name: settingsObj.site_name || defaultSettings.site_name,
          site_description: settingsObj.site_description || defaultSettings.site_description,
          contact_email: settingsObj.contact_email || defaultSettings.contact_email,
          contact_phone: settingsObj.contact_phone || defaultSettings.contact_phone,
          address: settingsObj.address || defaultSettings.address,
          logo_url: settingsObj.logo_url || defaultSettings.logo_url,
          primary_color: settingsObj.primary_color || defaultSettings.primary_color,
          secondary_color: settingsObj.secondary_color || defaultSettings.secondary_color,
          allow_public_submissions: settingsObj.allow_public_submissions === "true",
          require_approval: settingsObj.require_approval === "true",
          max_guests_per_submission:
            Number.parseInt(settingsObj.max_guests_per_submission) || defaultSettings.max_guests_per_submission,
          enable_notifications: settingsObj.enable_notifications === "true",
        })
      } else {
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const settingsArray = Object.entries(newSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === "boolean" ? value.toString() : value?.toString() || "",
      }))

      for (const setting of settingsArray) {
        const { error } = await supabase.from("site_settings").upsert(setting, { onConflict: "setting_key" })
        if (error) throw error
      }

      setSettings((prev) => ({ ...(prev ?? defaultSettings), ...newSettings }))
      toast.success("Configurações atualizadas com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      toast.error("Erro ao atualizar configurações.")
      throw error
    }
  }

  const setSiteName = async (name: string) => {
    await updateSettings({ site_name: name })
  }

  const value: SiteSettingsContextType = {
    settings,
    siteName: settings?.site_name ?? defaultSettings.site_name,
    loading,
    setSiteName,
    updateSettings,
  }

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings(): SiteSettingsContextType {
  const context = useContext(SiteSettingsContext)
  if (!context) {
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
