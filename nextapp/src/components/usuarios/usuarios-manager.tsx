'use client'

import { useState, useTransition } from 'react'
import { alternarStatusUsuario, excluirUsuario, type Usuario } from '@/lib/actions/usuarios'
import { CriarUsuarioDialog } from './criar-usuario-dialog'
import { EditarUsuarioDialog } from './editar-usuario-dialog'
import { UserPlus, Pencil, Loader2, Users, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ROLE_BADGE: Record<string, string> = {
    Admin: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    Portaria: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    Viewer: 'bg-muted/50 text-muted-foreground border-border',
}

interface Props {
    usuarios: Usuario[]
    currentUserId: string
}

export function UsuariosManager({ usuarios, currentUserId }: Props) {
    const router = useRouter()
    const [showCriar, setShowCriar] = useState(false)
    const [editando, setEditando] = useState<Usuario | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [excluindoId, setExcluindoId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [excluirError, setExcluirError] = useState<string | null>(null)
    const [, startTransition] = useTransition()

    function handleSuccess() {
        setShowCriar(false)
        setEditando(null)
        router.refresh()
    }

    async function handleToggleStatus(u: Usuario) {
        setTogglingId(u.id)
        const novoStatus = u.status === 'Ativo' ? 'Inativo' : 'Ativo'
        startTransition(async () => {
            await alternarStatusUsuario(u.id, novoStatus)
            setTogglingId(null)
        })
    }

    async function handleExcluir(id: string) {
        setExcluindoId(id)
        setExcluirError(null)
        startTransition(async () => {
            const result = await excluirUsuario(id)
            setExcluindoId(null)
            if (result.error) {
                setExcluirError(result.error)
            } else {
                setConfirmDeleteId(null)
                router.refresh()
            }
        })
    }

    return (
        <div className="space-y-5">
            {/* Header actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCriar(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Novo usuário
                </button>
            </div>

            {excluirError && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    Erro ao excluir: {excluirError}
                </p>
            )}

            {/* Table */}
            {usuarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 border border-dashed border-border rounded-2xl">
                    <Users className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado</p>
                </div>
            ) : (
                <div className="glass-card border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Usuário</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Função</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden md:table-cell">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Criado em</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {usuarios.map((u) => {
                                const isMe = u.id === currentUserId
                                return (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-muted/30 transition-colors ${u.status === 'Inativo' ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-foreground font-medium truncate max-w-[180px]">
                                                {u.nome}
                                                {isMe && (
                                                    <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>
                                                )}
                                            </p>
                                            <p className="text-muted-foreground text-xs truncate max-w-[180px]">{u.email}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.Viewer}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                                u.status === 'Ativo'
                                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-muted/50 text-muted-foreground border-border'
                                            }`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                                            {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!isMe && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditando(u)}
                                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(u)}
                                                            disabled={togglingId === u.id}
                                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 px-2 py-1 rounded-md hover:bg-muted/50"
                                                        >
                                                            {togglingId === u.id
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : u.status === 'Ativo' ? 'Desativar' : 'Ativar'
                                                            }
                                                        </button>
                                                        {confirmDeleteId === u.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-red-400">Confirmar?</span>
                                                                <button
                                                                    onClick={() => handleExcluir(u.id)}
                                                                    disabled={excluindoId === u.id}
                                                                    className="text-xs text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                                                >
                                                                    {excluindoId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sim'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                    className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-muted/50 transition-colors"
                                                                >
                                                                    Não
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmDeleteId(u.id)}
                                                                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showCriar && (
                <CriarUsuarioDialog
                    onClose={() => setShowCriar(false)}
                    onSuccess={handleSuccess}
                />
            )}

            {editando && (
                <EditarUsuarioDialog
                    usuario={editando}
                    onClose={() => setEditando(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
