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
                    className="glass-card bg-black/20 border border-white/10 text-foreground text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 min-w-[280px] shadow-sm appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a1a1aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                    <option value="" className="bg-muted/50 text-foreground">Selecione um evento...</option>
                    {eventos.map(e => (
                        <option key={e.id} value={e.id} className="bg-muted/50 text-foreground">{e.label}</option>
                    ))}
                </select>
                {isPending && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">Carregando...</span>}
            </div>

            {!data ? (
                <div className="glass-card border border-white/5 rounded-2xl p-16 text-center shadow-xl">
                    <p className="text-muted-foreground text-sm font-medium">Selecione um evento para ver as estatísticas</p>
                </div>
            ) : (
                <>
                    {/* Header do evento */}
                    <div className="glass-card border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{data.evento.nome}</h3>
                                <p className="text-muted-foreground text-sm font-medium mt-1">{data.evento.data}</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1.5">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Check-ins</span>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-foreground">{data.evento.totalCheckins}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>Capacidade</span>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-foreground">{data.evento.capacidade ?? '—'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Ocupação</span>
                                    </div>
                                    <p className={`text-3xl font-black tracking-tight ${data.evento.ocupacao >= 80 ? 'text-emerald-400' : data.evento.ocupacao >= 50 ? 'text-amber-400' : 'text-primary'}`}>
                                        {data.evento.ocupacao}%
                                    </p>
                                </div>
                            </div>
                        </div>
                        {data.evento.capacidade > 0 && (
                            <div className="mt-6 relative z-10">
                                <div className="w-full bg-black/40 border border-white/5 rounded-full h-2">
                                    <div
                                        className="h-full rounded-full transition-all bg-primary shadow-[0_0_12px_rgba(var(--primary),0.6)]"
                                        style={{ width: `${Math.min(data.evento.ocupacao, 100)}%` }}
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
