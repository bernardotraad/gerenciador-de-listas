'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deletarInstancia } from '@/lib/actions/eventos'

export function DeletarEventoButton({ id }: { id: string }) {
    const [confirm, setConfirm] = useState(false)
    const [pending, startTransition] = useTransition()

    if (!confirm) {
        return (
            <button
                onClick={() => setConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
                Deletar
            </button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Confirmar?</span>
            <button
                disabled={pending}
                onClick={() => startTransition(() => { void deletarInstancia(id) })}
                className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            >
                {pending ? 'Deletando...' : 'Sim'}
            </button>
            <button
                onClick={() => setConfirm(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                Não
            </button>
        </div>
    )
}
