'use client'

import { useState, useTransition } from 'react'
import { getDashboardEvento } from '@/lib/actions/dashboard'
import { CheckinsPorHoraChart } from './charts/CheckinsPorHoraChart'
import { ListaTipoDonutChart } from './charts/ListaTipoDonutChart'
import { OperadoresBarChart } from './charts/OperadoresBarChart'
import { Users, CheckCircle, TrendingUp } from 'lucide-react'

type EventoDisponivel = { id: string; label: string; status: string }

type EventoData = {
    evento: {
        nome: string
        data: string
        capacidade: number
        totalCheckins: number
        ocupacao: number
    }
    checkinsPorHora: { hora: string; total: number }[]
    tipoData: { nome: string; total: number }[]
    operadoresData: { nome: string; total: number }[]
}

interface Props {
    eventos: EventoDisponivel[]
    initialData: EventoData | null
    initialEventoId: string | null
}

export function EventoTab({ eventos, initialData, initialEventoId }: Props) {
    const [eventoId, setEventoId] = useState(initialEventoId ?? '')
    const [data, setData] = useState(initialData)
    const [isPending, startTransition] = useTransition()

    function selecionarEvento(id: string) {
        if (!id) { setEventoId(''); setData(null); return }
        setEventoId(id)
        startTransition(async () => {
            const novaData = await getDashboardEvento(id)
            setData(novaData)
        })
    }

    return (
        <div className="space-y-6">
            {/* Dropdown de evento */}
            <div className="flex items-center gap-3">
                <select
                    value={eventoId}
                    onChange={e => selecionarEvento(e.target.value)}
                    disabled={isPending}
                    className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--cor-tema)] focus:border-[var(--cor-tema)] disabled:opacity-50 min-w-[280px]"
                >
                    <option value="">Selecione um evento...</option>
                    {eventos.map(e => (
                        <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                </select>
                {isPending && <span className="text-xs text-zinc-500">Carregando...</span>}
            </div>

            {!data ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <p className="text-zinc-600 text-sm">Selecione um evento para ver as estatísticas</p>
                </div>
            ) : (
                <>
                    {/* Header do evento */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-100">{data.evento.nome}</h3>
                                <p className="text-zinc-500 text-sm mt-0.5">{data.evento.data}</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Check-ins</span>
                                    </div>
                                    <p className="text-2xl font-bold text-zinc-100">{data.evento.totalCheckins}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>Capacidade</span>
                                    </div>
                                    <p className="text-2xl font-bold text-zinc-100">{data.evento.capacidade ?? '—'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Ocupação</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${data.evento.ocupacao >= 80 ? 'text-emerald-400' : data.evento.ocupacao >= 50 ? 'text-amber-400' : 'text-zinc-100'}`}>
                                        {data.evento.ocupacao}%
                                    </p>
                                </div>
                            </div>
                        </div>
                        {data.evento.capacidade > 0 && (
                            <div className="mt-4">
                                <div className="w-full bg-zinc-800 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(data.evento.ocupacao, 100)}%`, backgroundColor: 'var(--cor-tema)' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <CheckinsPorHoraChart data={data.checkinsPorHora} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ListaTipoDonutChart data={data.tipoData} label="Check-ins por tipo de lista" />
                        <OperadoresBarChart data={data.operadoresData} />
                    </div>
                </>
            )}
        </div>
    )
}
