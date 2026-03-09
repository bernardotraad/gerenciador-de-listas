'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface CopiarLinkBoateProps {
    boateId: string
}

export function CopiarLinkBoate({ boateId }: CopiarLinkBoateProps) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        const url = `${window.location.origin}/?boate=${boateId}`
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        })
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-[var(--cor-tema)] border border-zinc-700 hover:border-[var(--cor-tema)] rounded-lg transition-all"
        >
            {copied
                ? <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-sm">Copiado!</span></>
                : <><Link2 className="w-4 h-4" />Link de submissão</>
            }
        </button>
    )
}
