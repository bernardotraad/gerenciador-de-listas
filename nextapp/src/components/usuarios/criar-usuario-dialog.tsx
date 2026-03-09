'use client'

import { useState, useTransition } from 'react'
import { criarUsuario } from '@/lib/actions/usuarios'
import { Loader2, X, UserPlus } from 'lucide-react'

interface Props {
    onClose: () => void
    onSuccess: () => void
}

export function CriarUsuarioDialog({ onClose, onSuccess }: Props) {
    const [email, setEmail] = useState('')
    const [nome, setNome] = useState('')
    const [senha, setSenha] = useState('')
    const [role, setRole] = useState<'Admin' | 'Portaria'>('Portaria')
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
            const result = await criarUsuario(email.trim(), nome.trim(), role, senha)
            if (result.error) {
                setError(result.error)
            } else {
                onSuccess()
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <UserPlus className="w-4 h-4" style={{ color: 'var(--cor-tema)' }} />
                        <h2 className="text-sm font-semibold text-zinc-100">Novo Usuário</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Nome completo"
                            required
                            minLength={2}
                            className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@exemplo.com"
                            required
                            className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                            className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Função</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'Admin' | 'Portaria')}
                            className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                        >
                            <option value="Portaria">Portaria</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={pending || nome.trim().length < 2 || !email.includes('@') || senha.length < 6}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Criar Usuário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
