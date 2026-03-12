'use client'

import { useState, useTransition } from 'react'
import { aprovarSubmissao, rejeitarSubmissao } from '@/lib/actions/submissoes'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SubStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Rascunho'

interface SubmissaoCardProps {
    id: string
    eventoNome: string
    dataEfetiva: string
    listaTipoNome: string | null
    submitterLabel: string | null
    parsedNames: string[]
    status: SubStatus
    approvalNotes: string | null
    createdAt: string
}

const STATUS_STYLE: Record<SubStatus, string> = {
    Pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Aprovado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Rejeitado: 'bg-red-500/15 text-red-400 border-red-500/30',
    Rascunho: 'bg-muted/50 text-muted-foreground border-border',
}

export function SubmissaoCard(props: SubmissaoCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [rejectNote, setRejectNote] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [pendingAprov, startAprov] = useTransition()
    const [pendingReject, startReject] = useTransition()

    const dataEvento = props.dataEfetiva
        ? format(parseISO(props.dataEfetiva), "dd/MM", { locale: ptBR })
        : '—'
    const dataSubmit = format(parseISO(props.createdAt), "dd/MM HH:mm", { locale: ptBR })

    function handleAprovar() {
        startAprov(async () => { await aprovarSubmissao(props.id) })
    }

    function handleRejeitar() {
        if (!rejectNote.trim()) return
        startReject(async () => { await rejeitarSubmissao(props.id, rejectNote) })
    }

    return (
        <div className={`glass-card border rounded-xl p-5 space-y-4 transition-all ${props.status === 'Pendente' ? 'border-amber-500/20 shadow-amber-500/5' : 'border-white/5'
            }`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{props.eventoNome} · {dataEvento}</p>
                    <p className="font-semibold text-foreground mt-0.5">
                        {props.submitterLabel ?? <span className="text-muted-foreground italic">Anônimo</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Enviado em {dataSubmit}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[props.status]}`}>
                        {props.status}
                    </span>
                    {props.listaTipoNome && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--cor-tema-subtle)', color: 'var(--cor-tema)', borderColor: 'color-mix(in oklch, var(--cor-tema) 30%, transparent)' }}>
                            {props.listaTipoNome}
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">{props.parsedNames.length} nomes</span>
                </div>
            </div>

            {/* Nomes (chips expansíveis) */}
            <div>
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Ocultar nomes' : 'Ver nomes'}
                </button>
                {expanded && (
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {props.parsedNames.map((nome, i) => (
                            <span
                                key={i}
                                className="text-xs bg-muted/50 text-foreground border border-border px-2 py-0.5 rounded-full"
                            >
                                {nome}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Nota de rejeição */}
            {props.approvalNotes && props.status === 'Rejeitado' && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    Motivo: {props.approvalNotes}
                </p>
            )}

            {/* Actions */}
            {props.status === 'Pendente' && (
                <div className="pt-1 border-t border-border space-y-3">
                    {!showRejectForm ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleAprovar}
                                disabled={pendingAprov}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                            >
                                {pendingAprov
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <CheckCircle className="w-3.5 h-3.5" />}
                                Aprovar
                            </button>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-colors"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Rejeitar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                                <input
                                type="text"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Motivo da rejeição..."
                                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRejeitar}
                                    disabled={pendingReject || !rejectNote.trim()}
                                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                                >
                                    {pendingReject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Confirmar rejeição
                                </button>
                                <button
                                    onClick={() => setShowRejectForm(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
