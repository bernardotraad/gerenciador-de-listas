import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, DoorOpen } from 'lucide-react'
import { GuestSearch } from '@/components/checkin/guest-search'
import { GuestRow } from '@/components/checkin/guest-row'
import { RealtimePortaria } from '@/components/checkin/realtime-portaria'
import { finalizarEventosPassados } from '@/lib/actions/eventos'

interface Props {
    searchParams: Promise<{ evento_id?: string; q?: string }>
}

export default async function PortariaPage({ searchParams }: Props) {
    await finalizarEventosPassados()

    const { evento_id, q } = await searchParams
    const supabase = await createClient()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Busca evento de hoje primeiro
    const { data: eventosHoje } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite, capacidade')
        .eq('status', 'Ativo')
        .eq('data_efetiva', today)
        .order('hora_inicio', { ascending: true })
        .limit(3)

    // Se não houver evento hoje, busca o próximo
    let eventosFallback: typeof eventosHoje = []
    if (!eventosHoje || eventosHoje.length === 0) {
        const { data } = await supabase
            .from('eventos_instancia')
            .select('id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite, capacidade')
            .eq('status', 'Ativo')
            .gt('data_efetiva', today)
            .order('data_efetiva', { ascending: true })
            .limit(1)
        eventosFallback = data ?? []
    }

    const eventos = (eventosHoje && eventosHoje.length > 0) ? eventosHoje : eventosFallback
    const isProximoEvento = !eventosHoje || eventosHoje.length === 0

    const eventoAtivo = eventos?.find((e) => e.id === evento_id) ?? eventos?.[0] ?? null

    // Verificar se evento já começou
    const agora = new Date()
    const horaAtual = agora.getHours() * 60 + agora.getMinutes()

    function horaParaMinutos(hora: string): number {
        const [h, m] = hora.split(':').map(Number)
        return (h ?? 0) * 60 + (m ?? 0)
    }

    const eventoJaComecou = eventoAtivo && !isProximoEvento
        ? horaAtual >= horaParaMinutos(eventoAtivo.hora_inicio)
        : false

    // Busca check-ins já feitos para este evento
    const checkinMap: Record<string, string> = {} // guestId → checkinId
    if (eventoAtivo) {
        const { data: checkins } = await supabase
            .from('check_in_records')
            .select('id, guest_id')
            .eq('evento_instancia_id', eventoAtivo.id)
            .eq('status', 'Presente')

        checkins?.forEach((c) => { checkinMap[c.guest_id] = c.id })
    }

    const totalPresentes = Object.keys(checkinMap).length

    // Busca convidados aprovados para o evento com nome do tipo de lista
    let guests: { id: string; nome: string; listaTipoNome: string | null }[] = []
    if (eventoAtivo) {
        let query = supabase
            .from('guest_records')
            .select('id, nome, lista_tipos ( nome )')
            .eq('evento_instancia_id', eventoAtivo.id)
            .eq('status', 'Aprovado')
            .order('nome', { ascending: true })

        if (q && q.trim().length > 0) {
            query = query.ilike('nome', `%${q.trim()}%`)
        }

        const { data } = await query.limit(q && q.trim().length > 0 ? 50 : 200)
        guests = (data ?? []).map((g: any) => ({
            id: g.id,
            nome: g.nome,
            listaTipoNome: (g.lista_tipos as { nome: string } | null)?.nome ?? null,
        }))
    }

    const semBusca = !q || q.trim().length === 0
    const pendentes = guests.filter((g) => !checkinMap[g.id])
    const presentes = guests.filter((g) => !!checkinMap[g.id])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Check-in</h1>
                    <p className="text-zinc-400 text-sm mt-1">Controle de entrada</p>
                </div>
                {eventoAtivo && !eventoJaComecou && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-xs font-medium text-amber-400">Portaria fechada</span>
                    </div>
                )}
                {eventoAtivo && eventoJaComecou && (
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <RealtimePortaria eventoInstanciaId={eventoAtivo.id} />
                            <p className="text-sm font-semibold text-zinc-200">{eventoAtivo.nome}</p>
                        </div>
                        <p className="text-xs text-zinc-500 capitalize">
                            {format(new Date(eventoAtivo.data_efetiva + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
                        </p>
                    </div>
                )}
            </div>

            {!eventoAtivo ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <DoorOpen className="w-12 h-12 text-zinc-600" />
                    <div>
                        <p className="text-zinc-300 font-medium">Nenhum evento ativo</p>
                        <p className="text-zinc-500 text-sm mt-1">Não há eventos agendados para hoje ou próximos dias.</p>
                    </div>
                </div>
            ) : eventoAtivo && !eventoJaComecou ? (
                <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-amber-800/50 rounded-2xl text-center bg-amber-950/20">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-amber-300 font-medium">
                            {isProximoEvento ? 'Próximo evento' : 'Aguardando abertura'}
                        </p>
                        <p className="text-zinc-400 text-sm mt-1">
                            {eventoAtivo.nome} · abre às {eventoAtivo.hora_inicio.slice(0, 5)}
                        </p>
                        {isProximoEvento && (
                            <p className="text-zinc-500 text-xs mt-1">
                                {format(new Date(eventoAtivo.data_efetiva + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Contador */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{totalPresentes}</p>
                            <p className="text-xs text-zinc-500 mt-1">Presentes</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-zinc-100">
                                {eventoAtivo.capacidade - totalPresentes}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Vagas restantes</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-zinc-400">{eventoAtivo.capacidade}</p>
                            <p className="text-xs text-zinc-500 mt-1">Capacidade</p>
                        </div>
                    </div>

                    {/* Barra de progresso de ocupação */}
                    {eventoAtivo.capacidade > 0 && (
                        <div className="space-y-1">
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        totalPresentes / eventoAtivo.capacidade >= 0.9
                                            ? 'bg-red-500'
                                            : totalPresentes / eventoAtivo.capacidade >= 0.7
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (totalPresentes / eventoAtivo.capacidade) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-zinc-600 text-right">
                                {Math.round((totalPresentes / eventoAtivo.capacidade) * 100)}% da capacidade
                            </p>
                        </div>
                    )}

                    {/* Busca */}
                    <GuestSearch eventoId={eventoAtivo.id} defaultValue={q ?? ''} />

                    {/* Resultados */}
                    {q && q.trim() ? (
                        <section className="space-y-2">
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                                {guests.length} resultado{guests.length !== 1 ? 's' : ''} para &quot;{q}&quot;
                            </p>
                            {guests.length === 0 ? (
                                <p className="text-center text-zinc-500 text-sm py-8">
                                    Nenhum convidado encontrado com este nome.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {guests.map((g) => (
                                        <GuestRow
                                            key={g.id}
                                            id={g.id}
                                            nome={g.nome}
                                            listaTipoNome={g.listaTipoNome}
                                            checkinId={checkinMap[g.id]}
                                            eventoInstanciaId={eventoAtivo.id}
                                            horaVipLimite={eventoAtivo.hora_vip_limite}
                                            horaInicio={eventoAtivo.hora_inicio}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : (
                        <>
                            {pendentes.length > 0 && (
                                <section className="space-y-2">
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                                        Aguardando check-in ({pendentes.length})
                                    </p>
                                    <div className="space-y-2">
                                        {pendentes.map((g) => (
                                            <GuestRow
                                                key={g.id}
                                                id={g.id}
                                                nome={g.nome}
                                                listaTipoNome={g.listaTipoNome}
                                                checkinId={checkinMap[g.id]}
                                                eventoInstanciaId={eventoAtivo.id}
                                                horaVipLimite={eventoAtivo.hora_vip_limite}
                                                horaInicio={eventoAtivo.hora_inicio}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {presentes.length > 0 && (
                                <section className="space-y-2">
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                                        Já presentes ({presentes.length})
                                    </p>
                                    <div className="space-y-2">
                                        {presentes.map((g) => (
                                            <GuestRow
                                                key={g.id}
                                                id={g.id}
                                                nome={g.nome}
                                                listaTipoNome={g.listaTipoNome}
                                                checkinId={checkinMap[g.id]}
                                                eventoInstanciaId={eventoAtivo.id}
                                                horaVipLimite={eventoAtivo.hora_vip_limite}
                                                horaInicio={eventoAtivo.hora_inicio}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {pendentes.length === 0 && presentes.length === 0 && (
                                <p className="text-center text-zinc-500 text-sm py-10">
                                    Nenhum convidado na lista deste evento.
                                </p>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}
