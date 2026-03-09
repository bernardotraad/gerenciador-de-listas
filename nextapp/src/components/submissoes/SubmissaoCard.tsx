'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SubStatus = 'Rascunho' | 'Pendente' | 'Aprovado' | 'Rejeitado'

const SUB_STATUS_BADGE: Record<SubStatus, string> = {
    Pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Aprovado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Rejeitado: 'bg-red-500/15 text-red-400 border-red-500/30',
    Rascunho: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

export function SubmissaoCard({
    nomes,
    status,
    createdAt,
}: {
    nomes: string[]
    status: SubStatus
    createdAt: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 cursor-pointer hover:border-zinc-700 transition-colors select-none"
            onClick={() => setOpen((v) => !v)}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-zinc-400 text-xs">{nomes.length} nome{nomes.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${SUB_STATUS_BADGE[status]}`}>
                        {status}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <p className="text-zinc-600 text-xs">
                {format(new Date(createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
            {open && nomes.length > 0 && (
                <ul className="pt-2 border-t border-zinc-800 space-y-1 max-h-48 overflow-y-auto">
                    {nomes.map((nome, i) => (
                        <li key={i} className="text-zinc-300 text-xs py-0.5">{nome}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}
