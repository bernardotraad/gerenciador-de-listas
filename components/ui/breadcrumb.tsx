"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Início", href: "/" }]

    const pathMap: Record<string, string> = {
      dashboard: "Dashboard",
      events: "Eventos",
      "guest-lists": "Listas de Convidados",
      "check-in": "Check-in",
      users: "Usuários",
      logs: "Logs",
      "enviar-nomes": "Enviar Nomes",
      login: "Login",
    }

    pathSegments.forEach((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label = pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ label, href: index === pathSegments.length - 1 ? undefined : href })
    })

    return breadcrumbs
  }

  const breadcrumbItems = items || generateBreadcrumbs()

  // Não mostrar breadcrumb na página inicial ou login
  if (pathname === "/" || pathname === "/login" || breadcrumbItems.length <= 1) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm text-muted-foreground mb-6 ${className}`}
    >
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors flex items-center">
              {index === 0 && <Home className="w-4 h-4 mr-1" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium flex items-center">
              {index === 0 && <Home className="w-4 h-4 mr-1" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
