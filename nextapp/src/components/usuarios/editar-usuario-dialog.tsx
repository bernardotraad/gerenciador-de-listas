'use client'

import { useState, useTransition } from 'react'
import { editarUsuario, alterarSenhaUsuario } from '@/lib/actions/usuarios'
import { Loader2, X, Pencil } from 'lucide-react'
import type { Usuario } from '@/lib/actions/usuarios'

interface Props {
    usuario: Usuario
    onClose: () => void
    onSuccess: () => void
}

export function EditarUsuarioDialog({ usuario, onClose, onSuccess }: Props) {
    const [nome, setNome] = useState(usuario.nome)
    const [role, setRole] = useState<'Admin' | 'Portaria'>(
        usuario.role === 'Admin' ? 'Admin' : 'Portaria'
    )
    const [novaSenha, setNovaSenha] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
            const result = await editarUsuario(usuario.id, { nome: nome.trim(), role })
            if (result.error) {
                setError(result.error)
                return
            }
            if (novaSenha.length >= 6) {
                const senhaResult = await alterarSenhaUsuario(usuario.id, novaSenha)
                if (senhaResult.error) {
                    setError(senhaResult.error)
                    return
                }
            }
            onSuccess()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <Pencil className="w-4 h-4" style={{ color: 'var(--cor-tema)' }} />
                        <h2 className="text-sm font-semibold text-zinc-100">Editar Usuário</h2>
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
                        <label className="text-xs font-medium text-zinc-400">Email</label>
                        <p className="text-sm text-zinc-500 px-3.5 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                            {usuario.email}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            minLength={2}
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

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">Nova senha <span className="text-zinc-600">(opcional)</span></label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Deixe em branco para não alterar"
                            minLength={6}
                            className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
                        />
                        {novaSenha.length > 0 && novaSenha.length < 6 && (
                            <p className="text-xs text-zinc-500">Mínimo 6 caracteres</p>
                        )}
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
                            disabled={pending || nome.trim().length < 2 || (novaSenha.length > 0 && novaSenha.length < 6)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
