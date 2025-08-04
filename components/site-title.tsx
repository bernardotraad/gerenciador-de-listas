"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"

const SiteTitle = () => {
  const { siteName } = useSiteSettings()

  return (
    <title>{siteName}</title>
  )
}

export { SiteTitle }
