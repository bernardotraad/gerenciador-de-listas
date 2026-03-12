'use client'

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from 'recharts'

interface Props {
    data: { nome: string; total: number }[]
}

const COLORS: Record<string, string> = {
    Pendentes: '#fbbf24', // amber-400
    Aprovadas: 'var(--primary)',
    Rejeitadas: '#f87171', // red-400
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <p className="font-semibold" style={{ color: COLORS[label] ?? 'var(--muted-foreground)' }}>
                {payload[0].value} submissões
            </p>
        </div>
    )
}

export function SubmissoesFunnelChart({ data }: Props) {
    return (
        <div className="glass-card border border-white/5 rounded-2xl p-6">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-6">Submissões por status</p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: 'var(--foreground)', fontSize: 12 }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={COLORS[entry.nome] ?? 'var(--muted-foreground)'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
