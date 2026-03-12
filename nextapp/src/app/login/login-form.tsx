'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SlideUp, ScaleIn } from '@/components/ui/motion'
import { LogIn } from 'lucide-react'

export function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError('Email ou senha incorretos.')
            setLoading(false)
        } else {
            window.location.replace('/')
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-transparent px-4 relative overflow-hidden">
            {/* Ambient background glow specifically for login page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10" />

            <div className="w-full max-w-sm">
                {/* Logo / Header */}
                <SlideUp delay={0.1} className="text-center mb-8">
                    <ScaleIn delay={0.2} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl shadow-primary/20 bg-gradient-to-br from-primary to-primary/60 border border-white/20">
                        <LogIn className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </ScaleIn>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Acesso VIP</h1>
                    <p className="text-muted-foreground text-sm mt-2">Painel de gerenciamento exclusivo</p>
                </SlideUp>

                {/* Form Card */}
                <SlideUp delay={0.2} className="glass-card rounded-[2rem] p-8 relative overflow-hidden">
                    {/* Subtle top edge highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground/80">
                                Email
                            </label>
                            <input
                                suppressHydrationWarning
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@clube.com"
                                required
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 hover:bg-black/30"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground/80">
                                Senha
                            </label>
                            <input
                                suppressHydrationWarning
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 hover:bg-black/30"
                            />
                        </div>

                        {error && (
                            <ScaleIn delay={0.1}>
                                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </ScaleIn>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl text-sm transition-all duration-300 mt-4 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : 'Acessar Conta'}
                        </button>
                    </form>
                </SlideUp>

                <SlideUp delay={0.4}>
                    <p suppressHydrationWarning className="text-center text-muted-foreground text-sm mt-8">
                        Gerenciador VIP © {new Date().getFullYear()}
                    </p>
                </SlideUp>
            </div>
        </main>
    )
}
