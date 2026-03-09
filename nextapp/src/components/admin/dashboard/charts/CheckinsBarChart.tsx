'use client'

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts'

interface Props {
    data: { dia?: string; semana?: string; total: number }[]
    dataKey?: string
    label?: string
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-lg">
            <p className="text-zinc-400 text-xs mb-1">{label}</p>
            <p className="font-semibold" style={{ color: 'var(--cor-tema)' }}>{payload[0].value} check-ins</p>
        </div>
    )
}

export function CheckinsBarChart({ data, dataKey = 'dia', label = 'Check-ins por dia' }: Props) {
    const maxVal = Math.max(...data.map(d => d.total), 1)

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">{label}</p>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey={dataKey}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--cor-tema-subtle)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={entry.total === maxVal ? 'var(--cor-tema)' : '#3f3f46'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
