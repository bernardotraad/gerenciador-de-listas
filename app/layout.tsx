import type React from "react"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/hooks/use-theme"
import { SiteSettingsProvider } from "@/hooks/use-site-settings"
import { Navbar } from "@/components/layout/navbar"
import { Toaster } from "@/components/ui/sonner"
import { SiteTitle } from "@/components/site-title"
import "./globals.css"

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Sistema de gerenciamento de listas e eventos" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          <SiteSettingsProvider>
            <AuthProvider>
              <SiteTitle />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <Toaster />
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "Sistema de Gestão",
  description: "Sistema de gerenciamento de listas e eventos",
  generator: 'v0.dev'
}

export default RootLayout
