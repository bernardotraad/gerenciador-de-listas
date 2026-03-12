'use client'

import { useState, useTransition } from 'react'
import { atualizarBoate, type BoateSettings } from '@/lib/actions/boate'
import { LogoUploader } from './logo-uploader'
import { Loader2, Save } from 'lucide-react'

interface Props {
    boate: BoateSettings
}

export function ConfiguracoesForm({ boate }: Props) {
    const [nome, setNome] = useState(boate.nome)
    const [capacidade, setCapacidade] = useState(boate.capacidade_padrao)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [pending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        startTransition(async () => {
            const result = await atualizarBoate({
                nome: nome.trim(),
                capacidade_padrao: capacidade,
            })
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
            {/* Identidade */}
            <div className="glass-card border-white/5 rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-semibold text-foreground">Identidade</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nome da Boate</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>

                <LogoUploader boateId={boate.id} currentLogoUrl={boate.logo_url} />

            </div>

            {/* Capacidade */}
            <div className="glass-card border-white/5 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Capacidade</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Capacidade Padrão por Evento</label>
                    <input
                        type="number"
                        value={capacidade}
                        onChange={(e) => setCapacidade(Number(e.target.value))}
                        min={1}
                        max={10000}
                        required
                        className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-muted-foreground">Usada como padrão ao criar novos eventos</p>
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            {success && (
                <p className="text-emerald-400 text-xs bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
                    Configurações salvas com sucesso!
                </p>
            )}

            <button
                type="submit"
                disabled={pending || nome.trim().length < 2}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
            >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar configurações
            </button>
        </form>
    )
}
