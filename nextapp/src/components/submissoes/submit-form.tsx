'use client'

import { useState, useTransition } from 'react'
import { parseNomes } from '@/lib/schemas/submissoes'
import { criarSubmissao } from '@/lib/actions/submissoes'
import { CheckCircle, Loader2 } from 'lucide-react'

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
}

export function SubmitForm({ boateId, eventos }: SubmitFormProps) {
    const [eventoId, setEventoId] = useState(eventos[0]?.id ?? '')
    const [listaTipoId, setListaTipoId] = useState(eventos[0]?.listaTipos[0]?.id ?? '')
    const [rawText, setRawText] = useState('')
    const [submitterLabel, setSubmitterLabel] = useState('')
    const [submitterEmail, setSubmitterEmail] = useState('')
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
            const result = await criarSubmissao({
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
                setSubmitterLabel('')
                setSubmitterEmail('')
            }
        })
    }

    if (success !== null) {
        return (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-zinc-100">Lista enviada!</p>
                    <p className="text-zinc-400 text-sm mt-1">
                        {success.count} nome{success.count !== 1 ? 's' : ''} submetido{success.count !== 1 ? 's' : ''} para {success.eventoNome}.
                    </p>
                    <p className="text-zinc-500 text-xs mt-2">
                        Aguarde a aprovação do admin.
                    </p>
                </div>
                <button
                    onClick={() => setSuccess(null)}
                    className="text-sm hover:opacity-80 transition-opacity mt-2"
                    style={{ color: 'var(--cor-tema)' }}
                >
                    Enviar outra lista
                </button>
            </div>
        )
    }

    const inputCls = "w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all"
    const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5"

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Evento */}
            <div>
                <label className={labelCls}>Evento</label>
                <select
                    value={eventoId}
                    onChange={(e) => handleEventoChange(e.target.value)}
                    className={inputCls}
                >
                    {eventos.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                            {evt.nome} — {new Date(evt.data_efetiva + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit'
                            })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tipo de lista */}
            {listaTiposDisponiveis.length > 0 && (
                <div>
                    <label className={labelCls}>Tipo de lista</label>
                    {listaTiposDisponiveis.length === 1 ? (
                        <div className="px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm">
                            {listaTiposDisponiveis[0]!.nome}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {listaTiposDisponiveis.map((tipo) => (
                                <button
                                    key={tipo.id}
                                    type="button"
                                    onClick={() => setListaTipoId(tipo.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                        listaTipoId === tipo.id
                                            ? 'text-white'
                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                                    }`}
                                    style={listaTipoId === tipo.id ? { backgroundColor: 'var(--cor-tema-subtle)', color: 'var(--cor-tema)', borderColor: 'var(--cor-tema)' } : undefined}
                                >
                                    {tipo.nome}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Info do evento selecionado */}
            {eventoSelecionado && (
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm">
                    <p className="font-semibold text-zinc-100">{eventoSelecionado.nome}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                        {new Date(eventoSelecionado.data_efetiva + 'T12:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long', day: '2-digit', month: 'long'
                        })} · {eventoSelecionado.hora_inicio.slice(0, 5)} às {eventoSelecionado.hora_fim.slice(0, 5)}
                    </p>
                </div>
            )}

            {/* Seu nome */}
            <div>
                <label className={labelCls}>Seu nome</label>
                <input
                    type="text"
                    value={submitterLabel}
                    onChange={(e) => setSubmitterLabel(e.target.value)}
                    placeholder="Ex: DJ Fulano"
                    maxLength={80}
                    minLength={2}
                    required
                    className={inputCls}
                />
            </div>

            {/* Seu e-mail */}
            <div>
                <label className={labelCls}>Seu e-mail</label>
                <input
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    placeholder="Ex: dj@email.com"
                    maxLength={120}
                    required
                    className={inputCls}
                />
            </div>

            {/* Lista de nomes */}
            <div>
                <label className={labelCls}>
                    Lista de convidados{' '}
                    {nomes.names.length > 0 && (
                        <span style={{ color: 'var(--cor-tema)' }}>{nomes.names.length} nome{nomes.names.length !== 1 ? 's' : ''}</span>
                    )}
                </label>
                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={"João Silva\nMaria Santos\nCarlos Oliveira"}
                    rows={8}
                    required
                    className={`${inputCls} resize-none font-mono`}
                />
                <p className="text-zinc-600 text-xs mt-1">Um nome por linha.</p>
            </div>

            {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={pending || nomes.names.length === 0 || !listaTipoId || submitterLabel.trim().length < 2 || submitterEmail.trim() === ''}
                className="w-full py-2.5 px-4 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? 'Enviando...' : `Enviar lista${nomes.names.length > 0 ? ` (${nomes.names.length})` : ''}`}
            </button>
        </form>
    )
}
