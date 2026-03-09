'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: 'var(--cor-tema)' }}>
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-50">Lista VIP</h1>
                    <p className="text-zinc-400 text-sm mt-1">Acesse o painel de gerenciamento</p>
                </div>

                {/* Form Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                                Email
                            </label>
                            <input
                                suppressHydrationWarning
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@clube.com"
                                required
                                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                                Senha
                            </label>
                            <input
                                suppressHydrationWarning
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-150 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : 'Entrar'}
                        </button>
                    </form>
                </div>

                <p suppressHydrationWarning className="text-center text-zinc-600 text-xs mt-6">
                    Gerenciador de Listas VIP © {new Date().getFullYear()}
                </p>
            </div>
        </main>
    )
}
