"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface SiteSettingsContextType {
  siteName: string
  setSiteName: (name: string) => Promise<void>
  loading: boolean
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteNameState] = useState("Casa de Show")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSiteSettings()

    // Listener para mudanças em tempo real
    const subscription = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          filter: "setting_key=eq.site_name",
        },
        (payload) => {
          if (payload.new && "setting_value" in payload.new) {
            setSiteNameState(payload.new.setting_value as string)
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "site_name")
        .single()

      if (error) {
        console.error("Erro ao buscar configurações:", error)
        return
      }

      if (data) {
        setSiteNameState(data.setting_value)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const setSiteName = async (name: string) => {
    try {
      // Primeiro, tentar atualizar o registro existente
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({
          setting_value: name,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "site_name")

      if (updateError) {
        console.error("Erro ao atualizar:", updateError)
        throw updateError
      }

      setSiteNameState(name)
    } catch (error) {
      console.error("Erro ao atualizar nome do site:", error)
      throw error
    }
  }

  return (
    <SiteSettingsContext.Provider value={{ siteName, setSiteName, loading }}>{children}</SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error("useSiteSettings deve ser usado dentro de SiteSettingsProvider")
  }
  return context
}
