'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
    eventoInstanciaId: string
}

export function RealtimeOverview({ eventoInstanciaId }: Props) {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`overview-${eventoInstanciaId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'check_in_records',
                    filter: `evento_instancia_id=eq.${eventoInstanciaId}`,
                },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventoInstanciaId, router])

    return (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            ao vivo
        </div>
    )
}
