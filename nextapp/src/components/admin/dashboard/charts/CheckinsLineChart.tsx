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
        <div className="glass-card border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <p className="font-semibold text-primary">{payload[0].value} check-ins</p>
        </div>
    )
}

export function CheckinsLineChart({ data, label = 'Check-ins por dia' }: Props) {
    return (
        <div className="glass-card border border-white/5 rounded-2xl p-6">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-6">{label}</p>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="data"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        dy={10}
                    />
                    <YAxis
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
