'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getDashboardSemana } from '@/lib/actions/dashboard'
import { CheckinsBarChart } from './charts/CheckinsBarChart'

type SemanaData = {
    checkinsDia: { dia: string; total: number }[]
    eventosData: {
        id: string
        nome: string
        data: string
        capacidade: number
        checkins: number
        ocupacao: number
        status: string
    }[]
}

interface Props {
    initialData: SemanaData
    initialSemana: string
}

export function SemanaTab({ initialData, initialSemana }: Props) {
    const [semanaInicio, setSemanaInicio] = useState(initialSemana)
    const [data, setData] = useState(initialData)
    const [isPending, startTransition] = useTransition()

    function navegar(direcao: 'anterior' | 'proxima') {
        const atual = new Date(semanaInicio + 'T12:00:00')
        const nova = direcao === 'anterior' ? subDays(atual, 7) : addDays(atual, 7)
        const novaStr = format(nova, 'yyyy-MM-dd')
        setSemanaInicio(novaStr)
        startTransition(async () => {
            const novaData = await getDashboardSemana(novaStr)
            if (novaData) setData(novaData)
        })
    }

    const fimSemana = addDays(new Date(semanaInicio + 'T12:00:00'), 6)
    const labelSemana = `${format(new Date(semanaInicio + 'T12:00:00'), 'dd/MM', { locale: ptBR })} – ${format(fimSemana, 'dd/MM/yyyy', { locale: ptBR })}`

    return (
        <div className="space-y-6">
            {/* Seletor de semana */}
            <div className="flex items-center justify-between glass-card border border-white/5 rounded-2xl p-4">
                <button
                    onClick={() => navegar('anterior')}
                    disabled={isPending}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 hover:border-white/20 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Visão Semanal</span>
                    <span className="text-sm font-medium text-foreground min-w-[160px] text-center">
                        {isPending ? 'Carregando...' : labelSemana}
                    </span>
                </div>
                <button
                    onClick={() => navegar('proxima')}
                    disabled={isPending}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 hover:border-white/20 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <CheckinsBarChart data={data.checkinsDia} dataKey="dia" label="Check-ins por dia da semana" />

            {/* Eventos da semana */}
            <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-white/5 bg-black/10">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Eventos da semana</p>
                </div>
                {data.eventosData.length === 0 ? (
                    <div className="px-6 py-10 text-center text-muted-foreground text-sm font-medium">Nenhum evento nesta semana</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {data.eventosData.map(evento => (
                            <div key={evento.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{evento.nome}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{evento.data}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-foreground">{evento.checkins}</p>
                                    <p className="text-xs text-muted-foreground">check-ins</p>
                                </div>
                                <div className="w-full sm:w-28 shrink-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Ocupação</span>
                                        <span className="text-xs font-medium text-foreground">{evento.ocupacao}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-2 border border-white/5">
                                        <div
                                            className="h-full rounded-full transition-all bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                            style={{ width: `${Math.min(evento.ocupacao, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="shrink-0 flex sm:justify-end">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                        evento.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : evento.status === 'Finalizado' ? 'bg-black/20 text-muted-foreground border-white/10' 
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        {evento.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
