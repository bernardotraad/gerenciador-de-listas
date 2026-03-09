'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { fazerCheckin, fazerSaida, type CheckinResult } from '@/lib/actions/checkin'
import { vipDentroDoHorario, formatarHora } from '@/lib/utils/checkin-horario'
import { Loader2, UserCheck, LogOut, Clock } from 'lucide-react'

type Feedback =
    | { tipo: 'sucesso' }
    | { tipo: 'bloqueado'; motivo: string }
    | { tipo: 'ja-presente' }

interface GuestRowProps {
    id: string
    nome: string
    listaTipoNome: string | null
    checkinId?: string
    eventoInstanciaId: string
    horaVipLimite?: string
    horaInicio?: string
}

export function GuestRow({
    id,
    nome,
    listaTipoNome,
    checkinId,
    eventoInstanciaId,
    horaVipLimite,
    horaInicio,
}: GuestRowProps) {
    const [pendingIn, startIn] = useTransition()
    const [pendingOut, startOut] = useTransition()
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const presente = !!checkinId

    const isVip = listaTipoNome?.toUpperCase().includes('VIP') ?? false
    const vipPassouLimite =
        isVip && horaVipLimite && horaInicio
            ? !vipDentroDoHorario(horaInicio, horaVipLimite)
            : false

    useEffect(() => {
        if (!feedback) return
        const timer = setTimeout(() => setFeedback(null), 3000)
        return () => clearTimeout(timer)
    }, [feedback])

    function handleCheckin() {
        startIn(async () => {
            const result = await fazerCheckin(id, eventoInstanciaId)
            if (result.ok) {
                setFeedback({ tipo: 'sucesso' })
                toast.success(`${nome} — Bem-vindo!`)
            } else if ('jaPresente' in result) {
                setFeedback({ tipo: 'ja-presente' })
                toast.warning(`${nome} já está dentro`)
            } else if ('bloqueado' in result) {
                setFeedback({ tipo: 'bloqueado', motivo: result.motivo })
                toast.error(`Bloqueado: ${result.motivo}`)
            } else {
                toast.error(result.erro)
            }
        })
    }

    function handleSaida() {
        if (!checkinId) return
        startOut(async () => { void fazerSaida(checkinId) })
    }

    const rowBg =
        feedback?.tipo === 'sucesso'
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : feedback?.tipo === 'bloqueado'
            ? 'bg-red-500/10 border-red-500/40'
            : feedback?.tipo === 'ja-presente'
            ? 'bg-amber-500/10 border-amber-500/40'
            : presente
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'

    return (
        <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${rowBg} ${feedback?.tipo === 'sucesso' ? 'scale-[1.01]' : 'scale-100'}`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold ${
                        presente ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                >
                    {nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p
                        className={`text-sm font-medium truncate ${
                            presente ? 'text-emerald-300' : 'text-zinc-100'
                        }`}
                    >
                        {nome}
                    </p>

                    {/* Feedback pós check-in */}
                    {feedback?.tipo === 'bloqueado' && (
                        <p className="text-xs text-red-400">{feedback.motivo}</p>
                    )}
                    {feedback?.tipo === 'ja-presente' && (
                        <p className="text-xs text-amber-400">Já está dentro</p>
                    )}

                    {/* Badge proativo de horário VIP */}
                    {!presente && !feedback && isVip && horaVipLimite && (
                        <p
                            className={`text-xs flex items-center gap-1 ${
                                vipPassouLimite ? 'text-red-400' : 'text-zinc-500'
                            }`}
                        >
                            <Clock className="w-3 h-3" />
                            até {formatarHora(horaVipLimite)}
                        </p>
                    )}

                    {/* Status presente */}
                    {presente && !feedback && (
                        <p className="text-xs text-emerald-500">Presente</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {listaTipoNome && (
                    <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full border"
                        style={{ backgroundColor: 'var(--cor-tema-subtle)', color: 'var(--cor-tema)', borderColor: 'var(--cor-tema-subtle)' }}
                    >
                        {listaTipoNome}
                    </span>
                )}

                {!presente ? (
                    <button
                        onClick={handleCheckin}
                        disabled={pendingIn}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        {pendingIn ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                        )}
                        Check-in
                    </button>
                ) : (
                    <button
                        onClick={handleSaida}
                        disabled={pendingOut}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors px-2 py-1.5"
                    >
                        {pendingOut ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <LogOut className="w-3.5 h-3.5" />
                        )}
                        Saída
                    </button>
                )}
            </div>
        </div>
    )
}
