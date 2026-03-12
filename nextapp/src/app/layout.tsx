import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gerenciador de Listas VIP',
  description: 'Gerencie listas VIP, check-ins e eventos com facilidade',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={`${outfit.className} bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground min-h-screen relative`}>
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--cor-tema-subtle)] blur-[120px]" />
        </div>
        
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
