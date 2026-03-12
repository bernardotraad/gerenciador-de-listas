'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'
import {
    LogOut, Users, LayoutDashboard, Calendar, Inbox,
    DoorOpen, Tag, History, Settings, Send, Menu, X, ChevronDown
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { LucideIcon } from 'lucide-react'

interface TopBarProps {
    boateNome?: string
    boateLogoUrl?: string | null
    userName?: string | null
    userAvatarUrl?: string | null
    userRole?: 'Admin' | 'Portaria'
    boateId?: string
    submissoesPendentes?: number
}

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
}

const ADMIN_PRIMARY: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
    { href: '/admin/submissoes', label: 'Submissões', icon: Inbox },
    { href: '/portaria', label: 'Portaria', icon: DoorOpen },
]

const ADMIN_SECONDARY: NavItem[] = [
    { href: '/admin/usuarios', label: 'Usuários', icon: Users },
    { href: '/admin/lista-tipos', label: 'Tipos de Lista', icon: Tag },
    { href: '/admin/historico', label: 'Histórico', icon: History },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

const PORTARIA_ITEMS: NavItem[] = [
    { href: '/portaria', label: 'Check-in', icon: DoorOpen },
]

function isActive(pathname: string, href: string): boolean {
    if (href === '/admin/dashboard' || href === '/portaria') return pathname === href
    return pathname.startsWith(href)
}

export function TopBar({
    boateNome,
    boateLogoUrl,
    userName,
    userAvatarUrl,
    userRole,
    boateId,
    submissoesPendentes = 0,
}: TopBarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [maisOpen, setMaisOpen] = useState(false)
    const maisRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!maisOpen) return
        function handleClick(e: MouseEvent) {
            if (maisRef.current && !maisRef.current.contains(e.target as Node)) {
                setMaisOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [maisOpen])

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }
    const homeHref = userRole === 'Portaria' ? '/portaria' : '/admin/dashboard'
    const initials = userName?.trim().charAt(0)?.toUpperCase() ?? '?'

    const primaryItems = userRole === 'Portaria' ? PORTARIA_ITEMS : ADMIN_PRIMARY
    const secondaryItems = userRole === 'Portaria' ? [] : ADMIN_SECONDARY
    const enviarNomesHref = boateId ? `/?boate=${boateId}` : null

    const allMobileItems: NavItem[] = [
        ...primaryItems,
        ...secondaryItems,
        ...(enviarNomesHref ? [{ href: enviarNomesHref, label: 'Enviar Nomes', icon: Send }] : []),
    ]

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/40 backdrop-blur-xl border-b border-white/5 shadow-sm">
                <div className="max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8 gap-4">
                {/* Logo */}
                <Link href={homeHref} className="flex items-center gap-2.5 shrink-0 group">
                    {boateLogoUrl ? (
                        <img
                            src={boateLogoUrl}
                            alt="Logo"
                            className="w-8 h-8 rounded-lg object-contain bg-black/20 p-0.5 group-hover:opacity-80 transition-opacity border border-white/10"
                        />
                    ) : (
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:opacity-80 transition-opacity bg-primary/20 border border-primary/30 shadow-inner"
                        >
                            <Users className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <span className="font-semibold text-foreground text-sm truncate max-w-[120px] group-hover:text-primary transition-colors tracking-tight">
                        {boateNome ?? 'Lista VIP'}
                    </span>
                </Link>

                {/* Desktop nav links */}
                <nav className="hidden lg:flex items-center gap-1.5 flex-1 ml-4">
                    {primaryItems.map((item) => {
                        const active = isActive(pathname, item.href)
                        const isSubmissoes = item.href === '/admin/submissoes'
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                    active 
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm shadow-primary/5' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                                {isSubmissoes && submissoesPendentes > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 min-w-[18px] h-4.5 rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 shadow-md bg-primary ring-2 ring-background"
                                    >
                                        {submissoesPendentes > 99 ? '99+' : submissoesPendentes}
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    {/* "Mais" dropdown for secondary items (Admin only) */}
                    {secondaryItems.length > 0 && (
                        <div className="relative" ref={maisRef}>
                            <button
                                type="button"
                                onClick={() => setMaisOpen((v) => !v)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                                    maisOpen ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                Mais
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${maisOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {maisOpen && (
                                <div className="absolute top-full left-0 mt-2 w-52 glass-card bg-background/95 rounded-xl shadow-2xl py-1.5 z-10 border border-white/10 origin-top-left animate-in fade-in zoom-in-95 duration-200">
                                    {secondaryItems.map((item) => {
                                        const active = isActive(pathname, item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMaisOpen(false)}
                                                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                                }`}
                                            >
                                                <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                                                {item.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </nav>

                {/* Right: profile + logout */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Enviar Nomes — visível em desktop */}
                    {enviarNomesHref && (
                        <Link
                            href={enviarNomesHref}
                            title="Enviar lista de nomes"
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4 shrink-0" />
                            <span>Enviar Nomes</span>
                        </Link>
                    )}
                    
                    <div className="h-6 w-px bg-white/10 hidden lg:block mx-1"></div>

                    <Link href="/perfil" className="flex items-center gap-2.5 group" title="Meu perfil">
                        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all border border-white/10">
                            {userAvatarUrl ? (
                                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">{initials}</span>
                            )}
                        </div>
                        {userRole && (
                            <span className="hidden lg:inline text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tracking-wide">
                                {userRole}
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Sair"
                        className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm transition-colors px-3 py-2 rounded-lg"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="hidden lg:inline">Sair</span>
                    </button>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                        aria-label="Abrir menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
                </div>
            </header>

            {/* Mobile navigation Sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="bg-background/95 backdrop-blur-2xl border-r border-white/10 w-72 p-0 shadow-2xl"
                >
                    <SheetHeader className="px-5 pt-5 pb-4 flex-row items-center justify-between border-b border-white/5">
                        <SheetTitle className="text-foreground text-base tracking-tight font-semibold flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Users className="w-3 h-3 text-primary" />
                            </div>
                            {boateNome ?? 'Lista VIP'}
                        </SheetTitle>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </SheetHeader>

                    <nav className="px-3 py-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-80px)]">
                        {allMobileItems.map((item) => {
                            const active = isActive(pathname, item.href)
                            const isSubmissoes = item.href === '/admin/submissoes'
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                                        active
                                        ? 'text-primary bg-primary/10 shadow-inner'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                    }`}
                                >
                                    <item.icon
                                        className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                                    />
                                    <span className="flex-1">{item.label}</span>
                                    {isSubmissoes && submissoesPendentes > 0 && (
                                        <span
                                            className="min-w-[20px] h-5 rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1.5 bg-primary shadow-sm"
                                        >
                                            {submissoesPendentes > 99 ? '99+' : submissoesPendentes}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}

                        <div className="my-4 border-t border-white/5" />

                        <Link
                            href="/perfil"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {userAvatarUrl ? (
                                    <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-semibold text-muted-foreground">{initials}</span>
                                )}
                            </div>
                            Meu perfil
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-auto"
                        >
                            <LogOut className="w-4.5 h-4.5 shrink-0" />
                            Sair
                        </button>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    )
}
