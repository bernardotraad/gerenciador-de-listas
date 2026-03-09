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
            <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-900 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8 gap-4">
                {/* Logo */}
                <Link href={homeHref} className="flex items-center gap-2.5 shrink-0 group">
                    {boateLogoUrl ? (
                        <img
                            src={boateLogoUrl}
                            alt="Logo"
                            className="w-7 h-7 rounded-lg object-contain bg-zinc-800 p-0.5 group-hover:opacity-80 transition-opacity"
                        />
                    ) : (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: 'var(--cor-tema)' }}
                        >
                            <Users className="w-3.5 h-3.5 text-white" />
                        </div>
                    )}
                    <span className="font-semibold text-zinc-100 text-sm truncate max-w-[120px] group-hover:text-white transition-colors">
                        {boateNome ?? 'Lista VIP'}
                    </span>
                </Link>

                {/* Desktop nav links */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {primaryItems.map((item) => {
                        const active = isActive(pathname, item.href)
                        const isSubmissoes = item.href === '/admin/submissoes'
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-zinc-800"
                                style={active
                                    ? { color: 'var(--cor-tema)', backgroundColor: 'var(--cor-tema-subtle)' }
                                    : { color: '#a1a1aa' }
                                }
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                                {isSubmissoes && submissoesPendentes > 0 && (
                                    <span
                                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1"
                                        style={{ backgroundColor: 'var(--cor-tema)' }}
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
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer select-none"
                            >
                                Mais
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${maisOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {maisOpen && (
                                <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-10">
                                    {secondaryItems.map((item) => {
                                        const active = isActive(pathname, item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMaisOpen(false)}
                                                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-800"
                                                style={active ? { color: 'var(--cor-tema)' } : { color: '#a1a1aa' }}
                                            >
                                                <item.icon
                                                    className="w-4 h-4 shrink-0"
                                                    style={active ? { color: 'var(--cor-tema)' } : { color: '#71717a' }}
                                                />
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
                <div className="flex items-center gap-2 ml-auto">
                    {/* Enviar Nomes — visível em desktop */}
                    {enviarNomesHref && (
                        <Link
                            href={enviarNomesHref}
                            title="Enviar lista de nomes"
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                            <Send className="w-4 h-4 shrink-0" />
                            <span className="hidden lg:inline">Enviar Nomes</span>
                        </Link>
                    )}
                    <Link href="/perfil" className="flex items-center gap-2" title="Meu perfil">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-zinc-700 hover:ring-[var(--cor-tema)] transition-all">
                            {userAvatarUrl ? (
                                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-medium text-zinc-300">{initials}</span>
                            )}
                        </div>
                        {userRole && (
                            <span className="hidden lg:inline text-[10px] font-medium text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                {userRole}
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Sair"
                        className="hidden sm:flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm transition-colors px-2 py-1.5 rounded-md hover:bg-zinc-800"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span className="hidden lg:inline">Sair</span>
                    </button>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
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
                    className="bg-zinc-900 border-r border-zinc-800 w-72 p-0"
                >
                    <SheetHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between">
                        <SheetTitle className="text-zinc-100 text-sm font-semibold">
                            {boateNome ?? 'Lista VIP'}
                        </SheetTitle>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </SheetHeader>

                    <nav className="px-2 pb-4 flex flex-col gap-0.5">
                        {allMobileItems.map((item) => {
                            const active = isActive(pathname, item.href)
                            const isSubmissoes = item.href === '/admin/submissoes'
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                    style={active
                                        ? { color: 'var(--cor-tema)', backgroundColor: 'var(--cor-tema-subtle)' }
                                        : { color: '#a1a1aa' }
                                    }
                                >
                                    <item.icon
                                        className="w-4 h-4 shrink-0"
                                        style={active ? { color: 'var(--cor-tema)' } : { color: '#71717a' }}
                                    />
                                    <span className="flex-1">{item.label}</span>
                                    {isSubmissoes && submissoesPendentes > 0 && (
                                        <span
                                            className="min-w-[18px] h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1.5"
                                            style={{ backgroundColor: 'var(--cor-tema)' }}
                                        >
                                            {submissoesPendentes > 99 ? '99+' : submissoesPendentes}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}

                        <div className="my-2 border-t border-zinc-800" />

                        <Link
                            href="/perfil"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                            <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                                {userAvatarUrl ? (
                                    <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[9px] font-medium text-zinc-300">{initials}</span>
                                )}
                            </div>
                            Meu perfil
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                            <LogOut className="w-4 h-4 shrink-0 text-zinc-600" />
                            Sair
                        </button>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    )
}
