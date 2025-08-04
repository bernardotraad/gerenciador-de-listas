"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, User, LogOut, Settings, Shield, Users, Calendar, CheckCircle, List, BarChart3, Home } from "lucide-react"

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  show: boolean
}

const LoadingSkeleton = () => (
  <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
      </div>
    </div>
  </nav>
)

const Logo = ({ settings, user }: { settings: any; user: any }) => (
  <div className="flex items-center space-x-4">
    <Link
      href={user ? "/dashboard" : "/enviar-nomes"}
      className="text-xl font-bold hover:text-primary transition-colors"
      aria-label="Ir para página inicial"
    >
      {settings?.site_name || "Sistema de Gestão"}
    </Link>
  </div>
)

const DesktopNavigation = ({ items }: { items: NavigationItem[] }) => (
  <div className="hidden md:flex items-center space-x-6">
    {items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Navegar para ${item.label}`}
      >
        {item.label}
      </Link>
    ))}
  </div>
)

const UserRoleBadge = ({ role }: { role: string }) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "portaria":
        return "Portaria"
      default:
        return "Usuário"
    }
  }

  const getRoleVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary"
  }

  return (
    <Badge variant={getRoleVariant(role)} className="w-fit">
      {getRoleLabel(role)}
    </Badge>
  )
}

const DesktopUserMenu = ({ 
  user, 
  canManageUsers, 
  handleSignOut 
}: { 
  user: any
  canManageUsers: boolean
  handleSignOut: () => void
}) => (
  <div className="hidden md:block">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full" 
          aria-label="Menu do usuário"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <UserRoleBadge role={user.role} />
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        {canManageUsers && (
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

const MobileUserInfo = ({ user }: { user: any }) => (
  <div className="flex items-center space-x-3 pb-4 border-b">
    <Avatar className="h-10 w-10">
      <AvatarFallback>
        {user.name?.charAt(0)?.toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <p className="font-medium">{user.name}</p>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <UserRoleBadge role={user.role} />
    </div>
  </div>
)

const MobileNavigation = ({ 
  items, 
  setIsOpen 
}: { 
  items: NavigationItem[]
  setIsOpen: (open: boolean) => void
}) => (
  <div className="flex flex-col space-y-2">
    {items.map((item) => {
      const Icon = item.icon
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsOpen(false)}
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
          aria-label={`Navegar para ${item.label}`}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      )
    })}
  </div>
)

const MobileMenu = ({ 
  user, 
  items, 
  isOpen, 
  setIsOpen, 
  handleSignOut 
}: { 
  user: any
  items: NavigationItem[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  handleSignOut: () => void
}) => (
  <div className="md:hidden">
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Abrir menu móvel"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="flex flex-col space-y-4">
          <MobileUserInfo user={user} />
          <MobileNavigation items={items} setIsOpen={setIsOpen} />
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
)

const GuestActions = () => (
  <div className="flex items-center space-x-2">
    <Button asChild variant="ghost" size="sm">
      <Link href="/enviar-nomes" aria-label="Enviar nomes para eventos">
        Enviar Nomes
      </Link>
    </Button>
    <Button asChild size="sm">
      <Link href="/login" aria-label="Fazer login">
        Login
      </Link>
    </Button>
  </div>
)

const Navbar = () => {
  const { user, signOut, loading } = useAuth()
  const { settings } = useSiteSettings()
  const { canManageUsers, canManageEvents, canViewLogs } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const navigationItems: NavigationItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home, show: !!user },
    { href: "/events", label: "Eventos", icon: Calendar, show: !!user && canManageEvents },
    { href: "/guest-lists", label: "Listas", icon: List, show: !!user },
    { href: "/check-in", label: "Check-in", icon: CheckCircle, show: !!user },
    { href: "/admin", label: "Admin", icon: Shield, show: !!user && canManageUsers },
    { href: "/users", label: "Usuários", icon: Users, show: !!user && canManageUsers },
    { href: "/logs", label: "Logs", icon: BarChart3, show: !!user && canViewLogs },
    { href: "/settings", label: "Configurações", icon: Settings, show: !!user && canManageUsers },
  ]

  const visibleItems = navigationItems.filter((item) => item.show)

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Logo settings={settings} user={user} />
          <DesktopNavigation items={visibleItems} />
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <>
                <DesktopUserMenu 
                  user={user} 
                  canManageUsers={canManageUsers} 
                  handleSignOut={handleSignOut} 
                />
                <MobileMenu 
                  user={user}
                  items={visibleItems}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  handleSignOut={handleSignOut}
                />
              </>
            ) : (
              <GuestActions />
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export { Navbar }
