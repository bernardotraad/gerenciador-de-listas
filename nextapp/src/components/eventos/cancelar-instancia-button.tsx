'use client'

import { useTransition } from 'react'
import { cancelarInstancia } from '@/lib/actions/eventos'
import { Loader2, XCircle } from 'lucide-react'

export function CancelarInstanciaButton({ id }: { id: string }) {
    const [pending, startTransition] = useTransition()

    function handleClick() {
        if (!confirm('Cancelar este evento?')) return
        startTransition(() => { void cancelarInstancia(id) })
    }

    return (
        <button
            onClick={handleClick}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
        >
            {pending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />
            }
            Cancelar evento
        </button>
    )
}
