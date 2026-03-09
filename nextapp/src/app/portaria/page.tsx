import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DoorOpen } from 'lucide-react'
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

    // Busca eventos ativos de hoje (ou mais próximos futuros)
    const { data: eventos } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite, capacidade')
        .eq('status', 'Ativo')
        .gte('data_efetiva', today)
        .order('data_efetiva', { ascending: true })
        .limit(5)

    const eventoAtivo = eventos?.find((e) => e.id === evento_id) ?? eventos?.[0] ?? null

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
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Check-in</h1>
                    <p className="text-zinc-400 text-sm mt-1">Controle de entrada</p>
                </div>
                {eventoAtivo && (
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
                    <DoorOpen className="w-10 h-10 text-zinc-600" />
                    <div>
                        <p className="text-zinc-300 font-medium">Nenhum evento ativo</p>
                        <p className="text-zinc-500 text-sm mt-1">Não há eventos agendados para hoje ou próximos dias.</p>
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
