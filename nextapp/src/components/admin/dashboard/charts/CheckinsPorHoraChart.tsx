'use client'

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'

interface Props {
    data: { hora: string; total: number }[]
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

export function CheckinsPorHoraChart({ data }: Props) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">Check-ins por hora</p>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradTema" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--cor-tema)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--cor-tema)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="hora"
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
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--cor-tema)"
                        strokeWidth={2}
                        fill="url(#gradTema)"
                        dot={false}
                        activeDot={{ r: 4, fill: 'var(--cor-tema)', strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
