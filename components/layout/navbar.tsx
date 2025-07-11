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

export function Navbar() {
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

  const navigationItems = [
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

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-4">
            <Link
              href={user ? "/dashboard" : "/enviar-nomes"}
              className="text-xl font-bold hover:text-primary transition-colors"
            >
              {settings?.site_name || "Sistema de Gestão"}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="w-fit">
                            {user.role === "admin" ? "Admin" : user.role === "portaria" ? "Portaria" : "Usuário"}
                          </Badge>
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

                {/* Mobile Menu */}
                <div className="md:hidden">
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <div className="flex flex-col space-y-4">
                        {/* User Info */}
                        <div className="flex items-center space-x-3 pb-4 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="w-fit mt-1">
                              {user.role === "admin" ? "Admin" : user.role === "portaria" ? "Portaria" : "Usuário"}
                            </Badge>
                          </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col space-y-2">
                          {visibleItems.map((item) => {
                            const Icon = item.icon
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                              >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>

                        {/* Logout */}
                        <div className="pt-4 border-t">
                          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/enviar-nomes">Enviar Nomes</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
