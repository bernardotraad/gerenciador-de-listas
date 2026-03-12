'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDashboardMes } from '@/lib/actions/dashboard'
import { CheckinsBarChart } from './charts/CheckinsBarChart'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type MesData = {
    checkinsSemanais: { semana: string; total: number }[]
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
    initialData: MesData
    initialMes: number
    initialAno: number
}

export function MesTab({ initialData, initialMes, initialAno }: Props) {
    const [mes, setMes] = useState(initialMes)
    const [ano, setAno] = useState(initialAno)
    const [data, setData] = useState(initialData)
    const [isPending, startTransition] = useTransition()

    function navegar(direcao: 'anterior' | 'proximo') {
        let novoMes = mes
        let novoAno = ano
        if (direcao === 'anterior') {
            novoMes = mes === 1 ? 12 : mes - 1
            novoAno = mes === 1 ? ano - 1 : ano
        } else {
            novoMes = mes === 12 ? 1 : mes + 1
            novoAno = mes === 12 ? ano + 1 : ano
        }
        setMes(novoMes)
        setAno(novoAno)
        startTransition(async () => {
            const novaData = await getDashboardMes(novoMes, novoAno)
            if (novaData) setData(novaData)
        })
    }

    return (
        <div className="space-y-6">
            {/* Seletor de mês */}
            <div className="flex items-center justify-between glass-card border border-white/5 rounded-2xl p-4">
                <button
                    onClick={() => navegar('anterior')}
                    disabled={isPending}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 hover:border-white/20 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Visão Mensal</span>
                    <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                        {isPending ? 'Carregando...' : `${MESES[mes - 1]} ${ano}`}
                    </span>
                </div>
                <button
                    onClick={() => navegar('proximo')}
                    disabled={isPending}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 hover:border-white/20 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <CheckinsBarChart
                data={data.checkinsSemanais.map(d => ({ dia: d.semana, total: d.total }))}
                dataKey="dia"
                label="Check-ins por semana do mês"
            />

            {/* Eventos do mês */}
            <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-white/5 bg-black/10">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Eventos de {MESES[mes - 1]}
                    </p>
                </div>
                {data.eventosData.length === 0 ? (
                    <div className="px-6 py-10 text-center text-muted-foreground text-sm font-medium">Nenhum evento neste mês</div>
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
