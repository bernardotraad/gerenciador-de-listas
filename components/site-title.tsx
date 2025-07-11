"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"
import { useEffect } from "react"

export function SiteTitle() {
  const { siteName, loading } = useSiteSettings()

  useEffect(() => {
    if (!loading) {
      document.title = `${siteName} - Listas`
    }
  }, [siteName, loading])

  return null
}
