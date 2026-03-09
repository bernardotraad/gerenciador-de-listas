'use client'

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'

interface Props {
    data: { data: string; total: number }[]
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

export function CheckinsLineChart({ data, label = 'Check-ins por dia' }: Props) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">{label}</p>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="data"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--cor-tema)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: 'var(--cor-tema)', strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
