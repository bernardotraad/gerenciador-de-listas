'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface Props {
    data: { nome: string; total: number }[]
    label?: string
}

const PALETTE = ['var(--cor-tema)', '#6366f1', '#a78bfa', '#7c3aed', '#4f46e5', '#c4b5fd']

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-lg">
            <p className="text-zinc-300 font-medium">{payload[0].name}</p>
            <p className="font-semibold" style={{ color: 'var(--cor-tema)' }}>{payload[0].value} check-ins</p>
        </div>
    )
}

export function ListaTipoDonutChart({ data, label = 'Check-ins por lista' }: Props) {
    if (!data.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-center h-[290px]">
                <p className="text-zinc-600 text-sm">Sem dados de check-in</p>
            </div>
        )
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-4">{label}</p>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        strokeWidth={0}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>}
                        iconType="circle"
                        iconSize={8}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
