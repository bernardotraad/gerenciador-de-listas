import { Calendar, Users, Clock, CheckCircle } from 'lucide-react'

interface Kpis {
    eventosAtivos: number | null
    convidadosAprovados: number | null
    submissoesPendentes: number | null
    checkinsHoje: number | null
}

const cards = [
    { key: 'eventosAtivos', label: 'Eventos Ativos', Icon: Calendar, color: '', bg: '' },
    { key: 'convidadosAprovados', label: 'Convidados Aprovados', Icon: Users, color: '[color:var(--cor-tema)]', bg: '[background-color:var(--cor-tema-subtle)]' },
    { key: 'submissoesPendentes', label: 'Submissões Pendentes', Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-600/10' },
    { key: 'checkinsHoje', label: 'Check-ins Hoje', Icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
] as const

export function KpiCards({ kpis }: { kpis: Kpis }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ key, label, Icon, color, bg }) => (
                <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${key === 'eventosAtivos' ? '' : bg}`}
                        style={key === 'eventosAtivos' ? { backgroundColor: 'var(--cor-tema-subtle)' } : undefined}
                    >
                        <Icon
                            className={`w-5 h-5 ${key === 'eventosAtivos' ? '' : color}`}
                            style={key === 'eventosAtivos' ? { color: 'var(--cor-tema)' } : undefined}
                        />
                    </div>
                    <div>
                        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-3xl font-bold text-zinc-100 mt-1">{kpis[key] ?? '—'}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
