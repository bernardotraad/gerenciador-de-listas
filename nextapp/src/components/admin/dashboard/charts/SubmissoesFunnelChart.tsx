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
    Pendentes: '#f59e0b',
    Aprovadas: 'var(--cor-tema)',
    Rejeitadas: '#ef4444',
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-lg">
            <p className="text-zinc-400 text-xs mb-1">{label}</p>
            <p className="font-semibold" style={{ color: COLORS[label] ?? '#a1a1aa' }}>
                {payload[0].value} submissões
            </p>
        </div>
    )
}

export function SubmissoesFunnelChart({ data }: Props) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">Submissões por status</p>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--cor-tema-subtle)' }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={COLORS[entry.nome] ?? '#52525b'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
