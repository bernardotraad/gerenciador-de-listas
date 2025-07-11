"use client"

import { useEffect } from "react"
import { useSiteSettings } from "@/hooks/use-site-settings"

export function SiteTitle() {
  const { settings, loading } = useSiteSettings()

  useEffect(() => {
    if (!loading && settings?.site_name) {
      document.title = settings.site_name
    }
  }, [settings?.site_name, loading])

  return null
}
