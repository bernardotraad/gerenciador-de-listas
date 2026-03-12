'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface Props {
    data: { nome: string; total: number }[]
    label?: string
}

const PALETTE = [
    'var(--primary)', 
    '#6366f1', 
    '#a78bfa', 
    '#7c3aed', 
    '#4f46e5', 
    '#c4b5fd'
]

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
            <p className="text-foreground font-medium mb-1">{payload[0].name}</p>
            <p className="font-semibold text-primary">{payload[0].value} check-ins</p>
        </div>
    )
}

export function ListaTipoDonutChart({ data, label = 'Check-ins por lista' }: Props) {
    if (!data.length) {
        return (
            <div className="glass-card border border-white/5 rounded-2xl p-6 flex items-center justify-center h-[290px]">
                <p className="text-muted-foreground text-sm font-medium">Sem dados de check-in</p>
            </div>
        )
    }

    return (
        <div className="glass-card border border-white/5 rounded-2xl p-6">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-6">{label}</p>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        strokeWidth={0}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
                        iconType="circle"
                        iconSize={8}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
