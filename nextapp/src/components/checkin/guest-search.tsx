'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { Search } from 'lucide-react'

interface GuestSearchProps {
    eventoId: string
    defaultValue?: string
}

export function GuestSearch({ eventoId, defaultValue = '' }: GuestSearchProps) {
    const router = useRouter()
    const [value, setValue] = useState(defaultValue)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function navigate(q: string) {
        const params = new URLSearchParams({ evento_id: eventoId, q })
        router.replace(`/portaria?${params.toString()}`)
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const q = e.target.value
        setValue(q)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => navigate(q.trim()), 300)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (timerRef.current) clearTimeout(timerRef.current)
        navigate(value.trim())
    }

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
                value={value}
                onChange={handleChange}
                placeholder="Buscar convidado pelo nome..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
            />
        </form>
    )
}
