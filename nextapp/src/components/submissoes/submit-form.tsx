'use client'

import { useState, useTransition } from 'react'
import { parseNomes } from '@/lib/schemas/submissoes'
import { criarSubmissao, criarSubmissaoLogada } from '@/lib/actions/submissoes'
import { CheckCircle, Loader2 } from 'lucide-react'
import { ScaleIn, FadeIn } from '@/components/ui/motion'

interface ListaTipo {
    id: string
    nome: string
}

interface Evento {
    id: string
    nome: string
    data_efetiva: string
    hora_inicio: string
    hora_fim: string
    listaTipos: ListaTipo[]
}

interface SubmitFormProps {
    boateId: string
    eventos: Evento[]
    initialNome?: string
    initialEmail?: string
    isLoggedIn?: boolean
}

export function SubmitForm({ boateId, eventos, initialNome, initialEmail, isLoggedIn }: SubmitFormProps) {
    const [eventoId, setEventoId] = useState(eventos[0]?.id ?? '')
    const [listaTipoId, setListaTipoId] = useState(eventos[0]?.listaTipos[0]?.id ?? '')
    const [rawText, setRawText] = useState('')
    const [submitterLabel, setSubmitterLabel] = useState(initialNome ?? '')
    const [submitterEmail, setSubmitterEmail] = useState(initialEmail ?? '')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<{ count: number; eventoNome: string } | null>(null)
    const [pending, startTransition] = useTransition()

    const eventoSelecionado = eventos.find((e) => e.id === eventoId) ?? eventos[0]
    const listaTiposDisponiveis = eventoSelecionado?.listaTipos ?? []
    const nomes = parseNomes(rawText)

    function handleEventoChange(newEventoId: string) {
        setEventoId(newEventoId)
        const novo = eventos.find((e) => e.id === newEventoId)
        setListaTipoId(novo?.listaTipos[0]?.id ?? '')
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
            const action = isLoggedIn ? criarSubmissaoLogada : criarSubmissao
            const result = await action({
                evento_instancia_id: eventoId,
                lista_tipo_id: listaTipoId,
                submitter_label: submitterLabel,
                submitter_email: submitterEmail,
                raw_text: rawText,
            })
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess({
                    count: result.count ?? 0,
                    eventoNome: eventoSelecionado?.nome ?? '',
                })
                setRawText('')
                if (!initialNome) setSubmitterLabel('')
                if (!initialEmail) setSubmitterEmail('')
            }
        })
    }

    if (success !== null) {
        return (
            <ScaleIn delay={0.1} className="flex flex-col items-center gap-4 py-8 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight">Lista enviada com sucesso!</h3>
                    <p className="text-muted-foreground text-sm">
                        {success.count} {success.count !== 1 ? 'convidados submetidos' : 'convidado submetido'} para {success.eventoNome}.
                    </p>
                    <div className="mt-4 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                        {isLoggedIn ? 'Lista aprovada automaticamente' : 'Aguardando aprovação da portaria'}
                    </div>
                </div>
                <button
                    onClick={() => setSuccess(null)}
                    className="mt-4 px-6 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary transition-all rounded-xl text-sm font-semibold border border-primary/20 cursor-pointer"
                >
                    Enviar nova lista
                </button>
            </ScaleIn>
        )
    }

    const inputCls = "w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all hover:bg-black/30"
    const labelCls = "block text-sm font-medium text-foreground/80 mb-2"

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Evento */}
                <div className="space-y-1">
                    <label className={labelCls}>Evento</label>
                    <select
                        value={eventoId}
                        onChange={(e) => handleEventoChange(e.target.value)}
                        className={inputCls}
                    >
                        {eventos.map((evt) => (
                            <option key={evt.id} value={evt.id} className="bg-background text-foreground">
                                {evt.nome} — {new Date(evt.data_efetiva + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: '2-digit'
                                })}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tipo de lista */}
                {listaTiposDisponiveis.length > 0 && (
                    <div className="space-y-1">
                        <label className={labelCls}>Tipo de lista</label>
                        {listaTiposDisponiveis.length === 1 ? (
                            <div className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-muted-foreground text-sm">
                                {listaTiposDisponiveis[0]!.nome}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {listaTiposDisponiveis.map((tipo) => (
                                    <button
                                        key={tipo.id}
                                        type="button"
                                        onClick={() => setListaTipoId(tipo.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                                            listaTipoId === tipo.id
                                                ? 'bg-primary/20 text-primary border-primary/40 shadow-sm shadow-primary/10'
                                                : 'bg-black/20 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
                                        }`}
                                    >
                                        {tipo.nome}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info do evento selecionado */}
            {eventoSelecionado && (
                <FadeIn delay={0.1}>
                    <div className="bg-primary/5 border border-primary/10 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <p className="font-semibold text-foreground tracking-tight">{eventoSelecionado.nome}</p>
                            <p className="text-primary text-xs font-medium">
                                {new Date(eventoSelecionado.data_efetiva + 'T12:00:00').toLocaleDateString('pt-BR', {
                                    weekday: 'long', day: '2-digit', month: 'long'
                                })}
                            </p>
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-black/20 border border-white/5 text-xs text-muted-foreground whitespace-nowrap">
                            {eventoSelecionado.hora_inicio.slice(0, 5)} — {eventoSelecionado.hora_fim.slice(0, 5)}
                        </div>
                    </div>
                </FadeIn>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Seu nome */}
                <div className="space-y-1">
                    <label className={labelCls}>Seu nome</label>
                    <input
                        type="text"
                        value={submitterLabel}
                        onChange={(e) => setSubmitterLabel(e.target.value)}
                        placeholder="Ex: Gabriel Freitas"
                        maxLength={80}
                        minLength={2}
                        required
                        className={inputCls}
                    />
                </div>

                {/* Seu e-mail */}
                <div className="space-y-1">
                    <label className={labelCls}>Seu e-mail</label>
                    <input
                        type="email"
                        value={submitterEmail}
                        onChange={(e) => setSubmitterEmail(e.target.value)}
                        placeholder="Ex: email@exemplo.com"
                        maxLength={120}
                        required
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Lista de nomes */}
            <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground/80">Listagem de Convidados</label>
                    {nomes.names.length > 0 && (
                        <FadeIn>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/20">
                                {nomes.names.length} nomes encontrados
                            </span>
                        </FadeIn>
                    )}
                </div>
                
                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={"João Silva\nMaria Santos\nCarlos Oliveira..."}
                    rows={7}
                    required
                    className={`${inputCls} resize-none font-mono leading-relaxed`}
                />
                <p className="text-muted-foreground text-xs mt-2 pl-1">Por favor, insira um nome completo por linha.</p>
                
                {nomes.names.length > 0 && (
                    <FadeIn delay={0.1}>
                        <div className="mt-4 p-4 bg-black/20 border border-white/10 rounded-xl space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {nomes.names.map((nome, i) => (
                                <p key={i} className="text-sm text-foreground/90 flex items-center gap-3">
                                    <span className="text-muted-foreground w-6 text-right shrink-0 font-mono text-xs">{i + 1}.</span>
                                    {nome}
                                </p>
                            ))}
                        </div>
                    </FadeIn>
                )}
            </div>

            {error && (
                <ScaleIn delay={0.1}>
                    <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex items-start gap-2">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1">{error}</span>
                    </div>
                </ScaleIn>
            )}

            <button
                type="submit"
                disabled={pending || nomes.names.length === 0 || !listaTipoId || submitterLabel.trim().length < 2 || submitterEmail.trim() === ''}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 mt-2"
            >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? 'Processando Lista...' : `Confirmar Lista (${nomes.names.length} nomes)`}
            </button>
        </form>
    )
}
