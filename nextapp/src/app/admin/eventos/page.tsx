import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Check, Link2 } from 'lucide-react'
import { EventoCard } from '@/components/eventos/evento-card'
import { NovoEventoDialog } from '@/components/eventos/novo-evento-dialog'
import { CopiarLinkBoate } from '@/components/eventos/copiar-link-boate'
import { finalizarEventosPassados } from '@/lib/actions/eventos'

export default async function EventosPage() {
    await finalizarEventosPassados()

    const supabase = await createClient()

    const today = format(new Date(), 'yyyy-MM-dd')

    // Busca instâncias com join de lista_tipos
    const { data: instancias } = await supabase
        .from('eventos_instancia')
        .select(`
            id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite,
            capacidade, semana_numero, status, template_id,
            evento_lista_tipos ( lista_tipos ( id, nome ) )
        `)
        .gte('data_efetiva', today)
        .order('data_efetiva', { ascending: true })

    // Busca lista_tipos ativos da boate do usuário
    const { data: userProfile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .single()

    const boateId = userProfile?.boate_id ?? null

    const { data: boateData } = boateId
        ? await supabase
            .from('boates')
            .select('capacidade_padrao')
            .eq('id', boateId)
            .single()
        : { data: null }

    const capacidadePadrao = boateData?.capacidade_padrao ?? 100

    const { data: listaTiposRaw } = boateId
        ? await supabase
            .from('lista_tipos')
            .select('id, nome')
            .eq('boate_id', boateId)
            .eq('ativo', true)
            .order('ordem', { ascending: true })
        : { data: [] }

    const listaTiposAtivos = (listaTiposRaw ?? []) as { id: string; nome: string }[]

    // Agrupa por mês
    const porMes = (instancias ?? []).reduce<Record<string, typeof instancias>>((acc, inst) => {
        const mes = format(parseISO(inst!.data_efetiva), 'MMMM yyyy', { locale: ptBR })
        if (!acc[mes]) acc[mes] = []
        acc[mes]!.push(inst)
        return acc
    }, {})

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Eventos</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        {instancias?.length ?? 0} evento(s) a partir de hoje
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {boateId && <CopiarLinkBoate boateId={boateId} />}
                    <NovoEventoDialog listaTipos={listaTiposAtivos} capacidadePadrao={capacidadePadrao} />
                </div>
            </div>

            {/* Lista */}
            {Object.keys(porMes).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <CalendarDays className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                        <p className="text-zinc-300 font-medium">Nenhum evento cadastrado</p>
                        <p className="text-zinc-500 text-sm mt-1">
                            Clique em &ldquo;Novo Evento&rdquo; para criar o primeiro.
                        </p>
                    </div>
                </div>
            ) : (
                Object.entries(porMes).map(([mes, eventosMes]) => (
                    <section key={mes} className="space-y-3">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest capitalize">
                            {mes}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {eventosMes?.map((evt) => {
                                // Extrai lista_tipos do join
                                const elt = (evt as any).evento_lista_tipos as Array<{ lista_tipos: { id: string; nome: string } | null }> ?? []
                                const listaTiposEvento = elt
                                    .map((r) => r.lista_tipos)
                                    .filter((t): t is { id: string; nome: string } => t !== null)

                                return (
                                    <EventoCard
                                        key={evt!.id}
                                        id={evt!.id}
                                        nome={evt!.nome}
                                        data_efetiva={evt!.data_efetiva}
                                        hora_inicio={evt!.hora_inicio}
                                        hora_fim={evt!.hora_fim}
                                        hora_vip_limite={evt!.hora_vip_limite}
                                        capacidade={evt!.capacidade}
                                        semana_numero={evt!.semana_numero}
                                        status={evt!.status as 'Ativo' | 'Cancelado' | 'Finalizado'}
                                        template_id={evt!.template_id}
                                        listaTipos={listaTiposEvento}
                                        todosListaTipos={listaTiposAtivos}
                                    />
                                )
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}
