'use client'

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
} from 'recharts'

interface Props {
    data: { nome: string; total: number }[]
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
            <p className="text-muted-foreground text-xs mb-1 font-medium">{label}</p>
            <p className="font-semibold text-primary">{payload[0].value} check-ins</p>
        </div>
    )
}

export function OperadoresBarChart({ data }: Props) {
    if (!data.length) {
        return (
            <div className="glass-card border border-white/5 rounded-2xl p-6 flex items-center justify-center h-[290px]">
                <p className="text-muted-foreground text-sm font-medium">Sem dados de operadores</p>
            </div>
        )
    }

    const maxVal = Math.max(...data.map(d => d.total), 1)

    return (
        <div className="glass-card border border-white/5 rounded-2xl p-6">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-6">Check-ins por operador</p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: 'var(--foreground)', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.total === maxVal ? 'var(--primary)' : 'var(--muted)'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
