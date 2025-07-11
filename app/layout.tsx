import type React from "react"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/hooks/use-theme"
import { SiteSettingsProvider } from "@/hooks/use-site-settings"
import { Navbar } from "@/components/layout/navbar"
import { Toaster } from "@/components/ui/sonner"
import { SiteTitle } from "@/components/site-title"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteSettingsProvider>
            <AuthProvider>
              <SiteTitle />
              <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main>{children}</main>
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
      generator: 'v0.dev'
    };
