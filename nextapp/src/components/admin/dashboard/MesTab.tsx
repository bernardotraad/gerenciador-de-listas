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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navegar('anterior')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-zinc-300 min-w-[140px] text-center">
                    {isPending ? 'Carregando...' : `${MESES[mes - 1]} ${ano}`}
                </span>
                <button
                    onClick={() => navegar('proximo')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <CheckinsBarChart
                data={data.checkinsSemanais.map(d => ({ dia: d.semana, total: d.total }))}
                dataKey="dia"
                label="Check-ins por semana do mês"
            />

            {/* Eventos do mês */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        Eventos de {MESES[mes - 1]}
                    </p>
                </div>
                {data.eventosData.length === 0 ? (
                    <div className="px-5 py-8 text-center text-zinc-600 text-sm">Nenhum evento neste mês</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {data.eventosData.map(evento => (
                            <div key={evento.id} className="px-5 py-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-200 truncate">{evento.nome}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{evento.data}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-zinc-100">{evento.checkins}</p>
                                    <p className="text-xs text-zinc-500">check-ins</p>
                                </div>
                                <div className="w-24 shrink-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-500">{evento.ocupacao}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{ width: `${Math.min(evento.ocupacao, 100)}%`, backgroundColor: 'var(--cor-tema)' }}
                                        />
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${evento.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : evento.status === 'Finalizado' ? 'bg-zinc-700 text-zinc-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {evento.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
