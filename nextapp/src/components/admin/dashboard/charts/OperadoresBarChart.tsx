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
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-lg">
            <p className="text-zinc-300 text-xs mb-1 font-medium">{label}</p>
            <p className="font-semibold" style={{ color: 'var(--cor-tema)' }}>{payload[0].value} check-ins</p>
        </div>
    )
}

export function OperadoresBarChart({ data }: Props) {
    if (!data.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-center h-[290px]">
                <p className="text-zinc-600 text-sm">Sem dados de operadores</p>
            </div>
        )
    }

    const maxVal = Math.max(...data.map(d => d.total), 1)

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">Check-ins por operador</p>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--cor-tema-subtle)' }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.total === maxVal ? 'var(--cor-tema)' : '#3f3f46'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
