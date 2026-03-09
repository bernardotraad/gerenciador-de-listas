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
    const [corTema, setCorTema] = useState(boate.cor_tema ?? '#7c3aed')
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
                cor_tema: corTema,
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-semibold text-zinc-300">Identidade</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Nome da Boate</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                    />
                </div>

                <LogoUploader boateId={boate.id} currentLogoUrl={boate.logo_url} />

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Cor do Tema</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={corTema}
                            onChange={(e) => setCorTema(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5"
                        />
                        <input
                            type="text"
                            value={corTema}
                            onChange={(e) => {
                                const val = e.target.value
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setCorTema(val)
                            }}
                            maxLength={7}
                            placeholder="#7c3aed"
                            className="w-28 px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm font-mono placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                        />
                        <span className="text-xs text-zinc-500">Cor usada nos destaques da interface</span>
                    </div>
                </div>
            </div>

            {/* Capacidade */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-zinc-300">Capacidade</h2>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Capacidade Padrão por Evento</label>
                    <input
                        type="number"
                        value={capacidade}
                        onChange={(e) => setCapacidade(Number(e.target.value))}
                        min={1}
                        max={10000}
                        required
                        className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-zinc-600">Usada como padrão ao criar novos eventos</p>
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
                className="flex items-center gap-2 px-5 py-2.5 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar configurações
            </button>
        </form>
    )
}
