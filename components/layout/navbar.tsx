"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { ROLE_LABELS } from "@/lib/constants"
import { Calendar, Home, LogOut, Settings, Send, Menu, UserCheck, BarChart3, User } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

export function Navbar() {
  const { user, signOut } = useAuth()
  const { siteName } = useSiteSettings()
  const permissions = usePermissions()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const isActivePath = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path))
  }

  const NavLink = ({ href, children, icon: Icon, onClick }: any) => (
    <Link href={href} onClick={onClick}>
      <Button
        variant={isActivePath(href) ? "secondary" : "ghost"}
        size="sm"
        className={`w-full justify-start h-12 text-base ${isActivePath(href) ? "bg-secondary" : ""}`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {children}
      </Button>
    </Link>
  )

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Site Title */}
            <Link
              href={user ? "/dashboard" : "/enviar-nomes"}
              className="text-xl font-bold hover:text-primary transition-colors"
            >
              {siteName || "Sistema de Gestão"}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-1">
              {permissions.canSendNames && (
                <Link href="/enviar-nomes">
                  <Button variant={isActivePath("/enviar-nomes") ? "secondary" : "ghost"} size="sm" className="h-10">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Nomes
                  </Button>
                </Link>
              )}

              {user && permissions.canViewDashboard && (
                <Link href="/dashboard">
                  <Button variant={isActivePath("/dashboard") ? "secondary" : "ghost"} size="sm" className="h-10">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}

              {permissions.canViewEvents && (
                <Link href="/events">
                  <Button variant={isActivePath("/events") ? "secondary" : "ghost"} size="sm" className="h-10">
                    <Calendar className="w-4 h-4 mr-2" />
                    Eventos
                  </Button>
                </Link>
              )}

              {permissions.canCheckIn && (
                <Link href="/check-in">
                  <Button variant={isActivePath("/check-in") ? "secondary" : "ghost"} size="sm" className="h-10">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Check-in
                  </Button>
                </Link>
              )}

              {(permissions.canManageUsers || permissions.canAccessSettings) && (
                <Link href="/admin">
                  <Button variant={isActivePath("/admin") ? "secondary" : "ghost"} size="sm" className="h-10">
                    <Settings className="w-4 h-4 mr-2" />
                    Administração
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <div className="flex flex-col space-y-2 mt-6">
                    {permissions.canSendNames && (
                      <NavLink href="/enviar-nomes" icon={Send} onClick={closeMobileMenu}>
                        Enviar Nomes
                      </NavLink>
                    )}

                    {user && permissions.canViewDashboard && (
                      <NavLink href="/dashboard" icon={Home} onClick={closeMobileMenu}>
                        Dashboard
                      </NavLink>
                    )}

                    {permissions.canViewEvents && (
                      <NavLink href="/events" icon={Calendar} onClick={closeMobileMenu}>
                        Eventos
                      </NavLink>
                    )}

                    {permissions.canCheckIn && (
                      <NavLink href="/check-in" icon={UserCheck} onClick={closeMobileMenu}>
                        Check-in
                      </NavLink>
                    )}

                    {permissions.canViewLogs && (
                      <NavLink href="/logs" icon={BarChart3} onClick={closeMobileMenu}>
                        Relatórios
                      </NavLink>
                    )}

                    {(permissions.canManageUsers || permissions.canAccessSettings) && (
                      <NavLink href="/admin" icon={Settings} onClick={closeMobileMenu}>
                        Administração
                      </NavLink>
                    )}

                    {/* User info and logout in mobile */}
                    {user && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12"
                          onClick={() => {
                            handleSignOut()
                            closeMobileMenu()
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sair
                        </Button>
                      </div>
                    )}

                    {/* Login button in mobile when not logged in */}
                    {!user && (
                      <div className="pt-4 border-t">
                        <Link href="/login" onClick={closeMobileMenu}>
                          <Button className="w-full h-12">
                            <User className="w-4 h-4 mr-3" />
                            Fazer Login
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <ThemeToggle />

            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="h-10 px-3 bg-transparent">
                  <LogOut className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Sair</span>
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-10 bg-transparent">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
