import { Calendar, Users, Clock, CheckCircle } from 'lucide-react'

interface Kpis {
    eventosAtivos: number | null
    convidadosAprovados: number | null
    submissoesPendentes: number | null
    checkinsHoje: number | null
}

const cards = [
    { key: 'eventosAtivos', label: 'Eventos Ativos', Icon: Calendar, color: 'text-primary', bg: 'bg-primary/20' },
    { key: 'convidadosAprovados', label: 'Convidados Aprovados', Icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    { key: 'submissoesPendentes', label: 'Submissões Pendentes', Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/20' },
    { key: 'checkinsHoje', label: 'Check-ins Hoje', Icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/20' },
] as const

export function KpiCards({ kpis }: { kpis: Kpis }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ key, label, Icon, color, bg }) => (
                <div key={key} className="glass-card rounded-xl p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{kpis[key] ?? '—'}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
