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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navegar('anterior')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-zinc-300 min-w-[160px] text-center">
                    {isPending ? 'Carregando...' : labelSemana}
                </span>
                <button
                    onClick={() => navegar('proxima')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <CheckinsBarChart data={data.checkinsDia} dataKey="dia" label="Check-ins por dia da semana" />

            {/* Eventos da semana */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Eventos da semana</p>
                </div>
                {data.eventosData.length === 0 ? (
                    <div className="px-5 py-8 text-center text-zinc-600 text-sm">Nenhum evento nesta semana</div>
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
