"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface SiteSettings {
  siteName: string
  siteDescription: string
  loading: boolean
  error: string | null
  setSiteName: (name: string) => Promise<void>
  setSiteDescription: (description: string) => Promise<void>
  refreshSettings: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [siteName, setSiteNameState] = useState("Sistema de Gestão")
  const [siteDescription, setSiteDescriptionState] = useState("Gestão de eventos e listas de convidados")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("site_settings").select("setting_key, setting_value")

      if (error) throw error

      if (data) {
        const nameRecord = data.find((record) => record.setting_key === "site_name")
        const descRecord = data.find((record) => record.setting_key === "site_description")

        if (nameRecord?.setting_value) {
          setSiteNameState(nameRecord.setting_value)
        }
        if (descRecord?.setting_value) {
          setSiteDescriptionState(descRecord.setting_value)
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err)
      setError("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const setSiteName = async (name: string) => {
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          setting_key: "site_name",
          setting_value: name,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      )

      if (error) throw error

      setSiteNameState(name)
      toast.success("Nome do site atualizado com sucesso!")
    } catch (err) {
      console.error("Erro ao atualizar nome do site:", err)
      toast.error("Erro ao atualizar nome do site")
      throw err
    }
  }

  const setSiteDescription = async (description: string) => {
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          setting_key: "site_description",
          setting_value: description,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      )

      if (error) throw error

      setSiteDescriptionState(description)
      toast.success("Descrição do site atualizada com sucesso!")
    } catch (err) {
      console.error("Erro ao atualizar descrição do site:", err)
      toast.error("Erro ao atualizar descrição do site")
      throw err
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const value: SiteSettings = {
    siteName,
    siteDescription,
    loading,
    error,
    setSiteName,
    setSiteDescription,
    refreshSettings,
  }

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider")
  }
  return context
}
