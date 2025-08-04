"use client"

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileView)
    }

    const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY)
    
    const handleMediaQueryChange = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileView)
    }

    mediaQueryList.addEventListener("change", handleMediaQueryChange)
    handleResize()

    return () => {
      mediaQueryList.removeEventListener("change", handleMediaQueryChange)
    }
  }, [])

  return Boolean(isMobile)
}

export { useIsMobile }
