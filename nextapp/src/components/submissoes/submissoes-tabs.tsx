'use client'

import { useState } from 'react'
import { InboxIcon } from 'lucide-react'
import { SubmissaoCard } from './submissao-card'

type SubStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Rascunho'
type Tab = 'pendentes' | 'historico'

const PENDENTES_ORDER: SubStatus[] = ['Rascunho', 'Pendente']
const HISTORICO_ORDER: SubStatus[] = ['Aprovado', 'Rejeitado']

interface Submissao {
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

interface SubmissoesTabs {
    submissoes: Submissao[]
}

export function SubmissoesTabs({ submissoes }: SubmissoesTabs) {
    const [tab, setTab] = useState<Tab>('pendentes')

    const pendentesItems = submissoes.filter((s) => PENDENTES_ORDER.includes(s.status))
    const historicoItems = submissoes.filter((s) => HISTORICO_ORDER.includes(s.status))

    const currentOrder = tab === 'pendentes' ? PENDENTES_ORDER : HISTORICO_ORDER
    const currentItems = tab === 'pendentes' ? pendentesItems : historicoItems

    const porStatus = currentOrder.reduce<Record<string, Submissao[]>>((acc, s) => {
        acc[s] = currentItems.filter((sub) => sub.status === s)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('pendentes')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        tab === 'pendentes'
                            ? 'bg-zinc-700 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    Pendentes ({pendentesItems.length})
                </button>
                <button
                    onClick={() => setTab('historico')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        tab === 'historico'
                            ? 'bg-zinc-700 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    Histórico ({historicoItems.length})
                </button>
            </div>

            {/* Content */}
            {currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <InboxIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                        <p className="text-zinc-300 font-medium">
                            {tab === 'pendentes' ? 'Nenhuma submissão pendente' : 'Nenhum histórico ainda'}
                        </p>
                    </div>
                </div>
            ) : (
                currentOrder.map((status) => {
                    const items = porStatus[status] ?? []
                    if (items.length === 0) return null
                    return (
                        <section key={status} className="space-y-3">
                            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                                {status} ({items.length})
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {items.map((sub) => (
                                    <SubmissaoCard
                                        key={sub.id}
                                        id={sub.id}
                                        eventoNome={sub.eventoNome}
                                        dataEfetiva={sub.dataEfetiva}
                                        listaTipoNome={sub.listaTipoNome}
                                        submitterLabel={sub.submitterLabel}
                                        parsedNames={sub.parsedNames}
                                        status={sub.status}
                                        approvalNotes={sub.approvalNotes}
                                        createdAt={sub.createdAt}
                                    />
                                ))}
                            </div>
                        </section>
                    )
                })
            )}
        </div>
    )
}
