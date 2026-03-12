import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Users, CheckCircle, Clock, InboxIcon } from 'lucide-react'
import { RealtimeOverview } from '@/components/eventos/realtime-overview'
import { SubmissaoCard } from '@/components/submissoes/SubmissaoCard'
import type { ReactNode } from 'react'

type GuestStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Presente'
type SubStatus = 'Rascunho' | 'Pendente' | 'Aprovado' | 'Rejeitado'
type EventoStatus = 'Ativo' | 'Cancelado' | 'Finalizado'

const GUEST_STATUS_ORDER: GuestStatus[] = ['Presente', 'Aprovado', 'Pendente', 'Rejeitado']

const GUEST_STATUS_BADGE: Record<GuestStatus, string> = {
    Presente: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Aprovado: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    Pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Rejeitado: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_BADGE: Record<EventoStatus, string> = {
    Ativo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Cancelado: 'bg-red-500/15 text-red-400 border-red-500/30',
    Finalizado: 'bg-muted/50 text-muted-foreground border-border',
}

const SUB_STATUS_BADGE: Record<SubStatus, string> = {
    Pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Aprovado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Rejeitado: 'bg-red-500/15 text-red-400 border-red-500/30',
    Rascunho: 'bg-muted/50 text-muted-foreground border-border',
}

function StatCard({
    label,
    value,
    sub,
    icon,
    color,
}: {
    label: string
    value: number
    sub: string
    icon: ReactNode
    color: string
}) {
    return (
        <div className="glass-card border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{label}</p>
                <span className={color}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
    )
}

export default async function EventoOverviewPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const [
        { data: evento },
        { data: checkins },
        { data: guests },
        { data: submissoes },
        { data: listaTiposEvento },
    ] = await Promise.all([
        supabase
            .from('eventos_instancia')
            .select('id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite, capacidade, status')
            .eq('id', id)
            .single(),
        supabase
            .from('check_in_records')
            .select('id, status, lista_tipo_nome, timestamp_entrada')
            .eq('evento_instancia_id', id),
        supabase
            .from('guest_records')
            .select('id, nome, status, submission_id, lista_tipos ( nome )')
            .eq('evento_instancia_id', id)
            .order('nome'),
        supabase
            .from('guest_submissions')
            .select('id, submitter_label, parsed_names, status, created_at')
            .eq('evento_instancia_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('evento_lista_tipos')
            .select('lista_tipos ( id, nome )')
            .eq('evento_instancia_id', id),
    ])

    if (!evento) notFound()

    // Stats
    const totalAprovados = (guests ?? []).filter(
        (g) => g.status === 'Aprovado' || g.status === 'Presente'
    ).length
    const presentes = (checkins ?? []).filter((c) => c.status === 'Presente').length
    const capacidade = evento.capacidade
    const taxaOcupacao = capacidade > 0 ? Math.round((presentes / capacidade) * 100) : 0
    const submissoesPendentes = (submissoes ?? []).filter((s) => s.status === 'Pendente').length

    // Check-ins por hora
    const checkinsPorHora = (checkins ?? []).reduce<Record<number, number>>((acc, c) => {
        if (!c.timestamp_entrada) return acc
        const hora = new Date(c.timestamp_entrada).getHours()
        acc[hora] = (acc[hora] ?? 0) + 1
        return acc
    }, {})

    // Distribuição por tipo de lista (baseado no snapshot lista_tipo_nome)
    const tipoCounts: Record<string, number> = {}
    for (const c of checkins ?? []) {
        const nome = c.lista_tipo_nome ?? 'Sem tipo'
        tipoCounts[nome] = (tipoCounts[nome] ?? 0) + 1
    }
    const totalCheckins = (checkins ?? []).length

    // Faixa de horas do evento (pode cruzar meia-noite)
    const horaInicio = parseInt(evento.hora_inicio.slice(0, 2))
    const horaFim = parseInt(evento.hora_fim.slice(0, 2))
    const horas: number[] = []
    let h = horaInicio
    while (h !== horaFim) {
        horas.push(h)
        h = (h + 1) % 24
    }
    horas.push(horaFim)
    const horasExibidas = horas.length > 1 ? horas : Array.from({ length: 6 }, (_, i) => (horaInicio + i) % 24)
    const peakCheckins = Math.max(1, ...horasExibidas.map((hora) => checkinsPorHora[hora] ?? 0))

    // Agrupa submissões por remetente
    const submissoesPorRemetente = (submissoes ?? []).reduce<Record<string, Array<NonNullable<typeof submissoes>[number]>>>((acc, sub) => {
        const key = sub.submitter_label || 'Anônimo'
        if (!acc[key]) acc[key] = []
        acc[key]!.push(sub)
        return acc
    }, {})
    const remetentesOrdenados = Object.entries(submissoesPorRemetente)
        .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))

    // Mapa submission_id → { aprovados, presentes }
    const guestPorSubmissao: Record<string, { aprovados: number; presentes: number }> = {}
    for (const g of guests ?? []) {
        const sid = (g as any).submission_id as string | null
        if (!sid) continue
        const entry = guestPorSubmissao[sid] ?? { aprovados: 0, presentes: 0 }
        if (g.status === 'Aprovado' || g.status === 'Presente') entry.aprovados++
        if (g.status === 'Presente') entry.presentes++
        guestPorSubmissao[sid] = entry
    }

    // Stats de conversão por remetente
    const statsRemetente = remetentesOrdenados.map(([remetente, subs]) => {
        const totalEnviados = subs.reduce((acc, s) => acc + ((s.parsed_names as string[] | null)?.length ?? 0), 0)
        const aprovados = subs.reduce((acc, s) => acc + (guestPorSubmissao[s.id]?.aprovados ?? 0), 0)
        const presentes = subs.reduce((acc, s) => acc + (guestPorSubmissao[s.id]?.presentes ?? 0), 0)
        const pctConversao = totalEnviados > 0 ? Math.round((presentes / totalEnviados) * 100) : 0
        return { remetente, totalEnviados, aprovados, presentes, pctConversao }
    })

    // Ordena convidados: Presente → Aprovado → Pendente → Rejeitado, depois nome
    const guestsSorted = [...(guests ?? [])].sort((a, b) => {
        const ai = GUEST_STATUS_ORDER.indexOf(a.status as GuestStatus)
        const bi = GUEST_STATUS_ORDER.indexOf(b.status as GuestStatus)
        return ai - bi || a.nome.localeCompare(b.nome, 'pt-BR')
    })

    // Tipos de lista deste evento
    const listaTipos = (listaTiposEvento ?? [])
        .map((r: any) => r.lista_tipos as { id: string; nome: string } | null)
        .filter((t): t is { id: string; nome: string } => t !== null)

    const dataEvento = parseISO(evento.data_efetiva)
    const diaSemana = format(dataEvento, 'EEEE', { locale: ptBR })
    const dataFormatada = format(dataEvento, "dd 'de' MMMM yyyy", { locale: ptBR })
    const cancelado = evento.status === 'Cancelado'

    // Palette of colors for tipo distribution
    const TIPO_COLORS = ['var(--cor-tema)', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="space-y-3">
                <Link
                    href="/admin/eventos"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Eventos
                </Link>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-xs text-muted-foreground capitalize">{diaSemana}</p>
                        <h1 className="text-2xl font-bold text-foreground">{evento.nome}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">{dataFormatada}</p>
                        <p className="text-muted-foreground text-sm mt-1">
                            {evento.hora_inicio.slice(0, 5)} – {evento.hora_fim.slice(0, 5)}
                            {' · '}VIP até {evento.hora_vip_limite.slice(0, 5)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {listaTipos.map((t) => (
                            <span
                                key={t.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary"
                            >
                                {t.nome}
                            </span>
                        ))}
                        <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE[evento.status as EventoStatus]}`}
                        >
                            {evento.status}
                        </span>
                        <RealtimeOverview eventoInstanciaId={id} />
                    </div>
                </div>
            </div>

            {cancelado && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    Este evento foi cancelado.
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Convidados aprovados"
                    value={totalAprovados}
                    sub={`de ${capacidade} vagas`}
                    icon={<Users className="w-4 h-4" />}
                    color="text-sky-400"
                />
                <StatCard
                    label="Presentes agora"
                    value={presentes}
                    sub={presentes === 1 ? 'pessoa' : 'pessoas'}
                    icon={<CheckCircle className="w-4 h-4" />}
                    color="text-emerald-400"
                />
                <div className="glass-card border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Taxa de ocupação</p>
                        <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{taxaOcupacao}%</p>
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                        <div
                            className="h-1.5 rounded-full transition-all bg-primary"
                            style={{ width: `${Math.min(taxaOcupacao, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {presentes} / {capacidade}
                    </p>
                </div>
                <StatCard
                    label="Submissões pendentes"
                    value={submissoesPendentes}
                    sub="aguardando aprovação"
                    icon={<InboxIcon className="w-4 h-4" />}
                    color="text-amber-400"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Check-ins por hora */}
                <div className="glass-card border-white/5 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-foreground">Check-ins por hora</h2>
                    {(checkins ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum check-in ainda</p>
                    ) : (
                        <div className="flex items-end gap-1.5" style={{ height: 96 + 20 }}>
                            {horasExibidas.map((hora) => {
                                const count = checkinsPorHora[hora] ?? 0
                                const barHeight = count > 0
                                    ? Math.max(8, Math.round((count / peakCheckins) * 96))
                                    : 4
                                return (
                                    <div key={hora} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex items-end" style={{ height: 96 }}>
                                            <div
                                                className={`w-full rounded-t-sm ${count > 0 ? 'bg-emerald-500' : 'bg-muted/50'}`}
                                                style={{ height: barHeight }}
                                                title={`${hora}h: ${count}`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{hora}h</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Distribuição por tipo de lista */}
                <div className="glass-card border-white/5 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-foreground">Distribuição por tipo de lista</h2>
                    {totalCheckins === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum check-in ainda</p>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {Object.entries(tipoCounts).map(([nome, count], idx) => {
                                const pct = Math.round((count / totalCheckins) * 100)
                                const colorStyle = TIPO_COLORS[idx % TIPO_COLORS.length]!
                                return (
                                    <div key={nome} className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{nome}</span>
                                            <span>{count} ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full"
                                                style={{ width: `${pct}%`, backgroundColor: colorStyle }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de convidados */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    Convidados ({(guests ?? []).length})
                </h2>
                {(guests ?? []).length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 border border-dashed border-border rounded-2xl">
                        <Users className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">Nenhum convidado ainda</p>
                    </div>
                ) : (
                    <div className="glass-card border-white/5 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                        Nome
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                                        Lista
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {guestsSorted.map((guest) => {
                                    const listaTipoNome = (guest.lista_tipos as unknown as { nome: string } | null)?.nome ?? null
                                    return (
                                        <tr key={guest.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-foreground font-medium">{guest.nome}</td>
                                            <td className="px-4 py-3">
                                                {listaTipoNome ? (
                                                    <span
                                                        className="text-xs font-medium px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary"
                                                    >
                                                        {listaTipoNome}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${GUEST_STATUS_BADGE[guest.status as GuestStatus]}`}
                                                >
                                                    {guest.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Submissões */}
            {(submissoes ?? []).length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Submissões ({(submissoes ?? []).length})
                    </h2>
                    {remetentesOrdenados.map(([remetente, subs]) => (
                        <div key={remetente} className="space-y-2">
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-semibold text-foreground">{remetente}</p>
                                <span className="text-xs text-muted-foreground">
                                    {subs.length} lista{subs.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {subs.map((sub) => (
                                    <SubmissaoCard
                                        key={sub.id}
                                        nomes={(sub.parsed_names as string[] | null) ?? []}
                                        status={sub.status as SubStatus}
                                        createdAt={sub.created_at}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {statsRemetente.some((s) => s.aprovados > 0) && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Conversão por remetente
                            </h3>
                            <div className="glass-card border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground">Remetente</th>
                                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground">Enviados</th>
                                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground">Aprovados</th>
                                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground">Check-ins</th>
                                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground">Conversão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {statsRemetente.map(({ remetente, totalEnviados, aprovados, presentes, pctConversao }) => (
                                            <tr key={remetente}>
                                                <td className="px-4 py-2.5 text-foreground font-medium">{remetente}</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{totalEnviados}</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{aprovados}</td>
                                                <td className="px-4 py-2.5 text-right text-emerald-400 font-medium">{presentes}</td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span
                                                        className={`font-semibold ${pctConversao > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                                                    >
                                                        {pctConversao}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
