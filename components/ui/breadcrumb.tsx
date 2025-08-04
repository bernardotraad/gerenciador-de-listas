"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

const formatSegmentLabel = (segment: string): string => {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const generateBreadcrumbs = (): BreadcrumbItem[] => {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return []
  }

  const breadcrumbs: BreadcrumbItem[] = []

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const label = formatSegmentLabel(segment)
    const isLastItem = index === segments.length - 1

    breadcrumbs.push({
      label,
      href: isLastItem ? undefined : href,
    })
  })

  return breadcrumbs
}

const BreadcrumbItem = ({ 
  item, 
  isLast 
}: { 
  item: BreadcrumbItem
  isLast: boolean 
}) => (
  <div className="flex items-center">
    <ChevronRight className="h-4 w-4 mx-1" />
    {item.href ? (
      <Link
        href={item.href}
        className="hover:text-foreground transition-colors"
        aria-label={`Navegar para ${item.label}`}
      >
        {item.label}
      </Link>
    ) : (
      <span className="text-foreground font-medium">{item.label}</span>
    )}
  </div>
)

const HomeLink = () => (
  <Link
    href="/"
    className="flex items-center hover:text-foreground transition-colors"
    aria-label="Ir para página inicial"
  >
    <Home className="h-4 w-4" />
  </Link>
)

const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
  const breadcrumbItems = items || generateBreadcrumbs()

  if (breadcrumbItems.length === 0) {
    return null
  }

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground mb-4", className)} 
      aria-label="Breadcrumb"
    >
      <HomeLink />

      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem 
          key={index} 
          item={item} 
          isLast={index === breadcrumbItems.length - 1} 
        />
      ))}
    </nav>
  )
}

export { Breadcrumb }
export type { BreadcrumbItem, BreadcrumbProps }
