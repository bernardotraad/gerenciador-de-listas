"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setSystemTheme: () => void
}

const STORAGE_KEY = "venue-ui-theme"

const ThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) => {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "system"
  }
  
  const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme
  return savedTheme || "system"
}

const applyThemeToDocument = (theme: Theme) => {
  if (typeof window === "undefined") {
    return
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", isDark)
}

const useTheme = (): ThemeContextValue => {
  const [mounted, setMounted] = React.useState(false)
  const [theme, setTheme] = React.useState<Theme>("system")

  React.useEffect(() => {
    setMounted(true)
    const storedTheme = getStoredTheme()
    setTheme(storedTheme)
    applyThemeToDocument(storedTheme)
  }, [])

  const handleToggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyThemeToDocument(newTheme)
  }

  const handleSetSystemTheme = () => {
    setTheme("system")
    localStorage.setItem(STORAGE_KEY, "system")
    applyThemeToDocument("system")
  }

  if (!mounted) {
    return {
      theme: "system",
      toggleTheme: () => {},
      setSystemTheme: () => {},
    }
  }

  return {
    theme,
    toggleTheme: handleToggleTheme,
    setSystemTheme: handleSetSystemTheme,
  }
}

export { ThemeProvider, useTheme }
export type { Theme, ThemeContextValue }
