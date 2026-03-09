'use client'

import { useState } from 'react'
import { GeralTab } from './GeralTab'
import { SemanaTab } from './SemanaTab'
import { MesTab } from './MesTab'
import { EventoTab } from './EventoTab'

type Tab = 'geral' | 'semana' | 'mes' | 'evento'

const TABS: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'semana', label: 'Por Semana' },
    { id: 'mes', label: 'Por Mês' },
    { id: 'evento', label: 'Por Evento' },
]

interface Props {
    geralData: NonNullable<Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getDashboardGeral>>>
    semanaData: NonNullable<Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getDashboardSemana>>>
    semanaInicio: string
    mesData: NonNullable<Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getDashboardMes>>>
    mes: number
    ano: number
    eventos: { id: string; label: string; status: string }[]
    primeiroEventoId: string | null
    primeiroEventoData: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getDashboardEvento>>
}

export function DashboardTabs({
    geralData,
    semanaData,
    semanaInicio,
    mesData,
    mes,
    ano,
    eventos,
    primeiroEventoId,
    primeiroEventoData,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('geral')

    return (
        <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={activeTab === tab.id ? { backgroundColor: 'var(--cor-tema)' } : undefined}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo */}
            {activeTab === 'geral' && <GeralTab data={geralData} />}
            {activeTab === 'semana' && (
                <SemanaTab initialData={semanaData} initialSemana={semanaInicio} />
            )}
            {activeTab === 'mes' && (
                <MesTab initialData={mesData} initialMes={mes} initialAno={ano} />
            )}
            {activeTab === 'evento' && (
                <EventoTab
                    eventos={eventos}
                    initialData={primeiroEventoData}
                    initialEventoId={primeiroEventoId}
                />
            )}
        </div>
    )
}
