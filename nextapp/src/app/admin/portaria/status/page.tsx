import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, CheckCircle, Activity, UserCheck } from 'lucide-react'
import { RealtimePortariaStatus } from '@/components/portaria/realtime-portaria-status'

export default async function PortariaStatusPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user!.id)
        .single()

    const hoje = new Date()
    const hojeStr = format(hoje, 'yyyy-MM-dd')

    // Busca evento ativo hoje
    const { data: eventoHoje } = await supabase
        .from('eventos_instancia')
        .select('id, nome, hora_inicio, hora_fim, hora_vip_limite, capacidade')
        .eq('boate_id', profile!.boate_id)
        .eq('data_efetiva', hojeStr)
        .eq('status', 'Ativo')
        .order('hora_inicio')
        .limit(1)
        .maybeSingle()

    if (!eventoHoje) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--cor-tema-subtle)' }}>
                        <Activity className="w-5 h-5" style={{ color: 'var(--cor-tema)' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-50">Status da Portaria</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">Monitoramento em tempo real</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 py-20 border border-dashed border-zinc-800 rounded-2xl">
                    <Activity className="w-8 h-8 text-zinc-600" />
                    <p className="text-zinc-500 text-sm">Nenhum evento ativo hoje</p>
                    <p className="text-zinc-600 text-xs">
                        {format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>
            </div>
        )
    }

    // Busca check-ins do evento de hoje
    const { data: checkins } = await supabase
        .from('check_in_records')
        .select(`
            id,
            status,
            lista_tipo_nome,
            timestamp_entrada,
            portaria_user_id,
            guest_records ( nome )
        `)
        .eq('evento_instancia_id', eventoHoje.id)
        .order('timestamp_entrada', { ascending: false })

    const allCheckins = checkins ?? []
    const presentes = allCheckins.filter((c) => c.status === 'Presente')
    const taxaOcupacao = eventoHoje.capacidade > 0
        ? Math.round((presentes.length / eventoHoje.capacidade) * 100)
        : 0

    // Agrupa operadores
    const operadoresCounts: Record<string, number> = {}
    const operadoresIds: string[] = []
    for (const c of allCheckins) {
        if (!c.portaria_user_id) continue
        if (!operadoresCounts[c.portaria_user_id]) {
            operadoresCounts[c.portaria_user_id] = 0
            operadoresIds.push(c.portaria_user_id)
        }
        operadoresCounts[c.portaria_user_id]++
    }

    // Busca nomes dos operadores
    const operadoresNomes: Record<string, string> = {}
    if (operadoresIds.length > 0) {
        const { data: ops } = await supabase
            .from('users')
            .select('id, nome')
            .in('id', operadoresIds)
        for (const op of ops ?? []) {
            operadoresNomes[op.id] = op.nome
        }
    }

    // Distribuição por tipo de lista
    const tipoCounts: Record<string, number> = {}
    for (const c of allCheckins) {
        const tipo = c.lista_tipo_nome ?? 'Sem tipo'
        tipoCounts[tipo] = (tipoCounts[tipo] ?? 0) + 1
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--cor-tema-subtle)' }}>
                        <Activity className="w-5 h-5" style={{ color: 'var(--cor-tema)' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-50">Status da Portaria</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">Monitoramento em tempo real</p>
                    </div>
                </div>
                <RealtimePortariaStatus eventoInstanciaId={eventoHoje.id} />
            </div>

            {/* Evento ativo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-1">Evento de hoje</p>
                <p className="text-lg font-bold text-zinc-50">{eventoHoje.nome}</p>
                <p className="text-zinc-400 text-sm mt-0.5">
                    {eventoHoje.hora_inicio.slice(0, 5)} – {eventoHoje.hora_fim.slice(0, 5)}
                    {' · '} VIP até {eventoHoje.hora_vip_limite.slice(0, 5)}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Presentes */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Presentes</p>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-zinc-50">{presentes.length}</p>
                    <div>
                        <p className="text-xs text-zinc-600 mb-1">de {eventoHoje.capacidade} vagas ({taxaOcupacao}%)</p>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                            <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(taxaOcupacao, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Total check-ins */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Total Check-ins</p>
                        <Users className="w-4 h-4 text-sky-400" />
                    </div>
                    <p className="text-3xl font-bold text-zinc-50">{allCheckins.length}</p>
                    <p className="text-xs text-zinc-600">inclui saídas registradas</p>
                </div>

                {/* Operadores */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Operadores</p>
                        <UserCheck className="w-4 h-4" style={{ color: 'var(--cor-tema)' }} />
                    </div>
                    <p className="text-3xl font-bold text-zinc-50">{operadoresIds.length}</p>
                    <p className="text-xs text-zinc-600">ativos no evento</p>
                </div>
            </div>

            {/* Operadores ativos */}
            {operadoresIds.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                        Operadores ativos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {operadoresIds.map((opId) => (
                            <div
                                key={opId}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--cor-tema-subtle)' }}>
                                        <UserCheck className="w-4 h-4" style={{ color: 'var(--cor-tema)' }} />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-200">
                                        {operadoresNomes[opId] ?? 'Portaria'}
                                    </p>
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-sky-500/15 text-sky-400 border-sky-500/30">
                                    {operadoresCounts[opId]} check-ins
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Distribuição por tipo */}
            {Object.keys(tipoCounts).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300">Distribuição por tipo de lista</h2>
                    <div className="space-y-3">
                        {Object.entries(tipoCounts).map(([tipo, count]) => {
                            const pct = Math.round((count / allCheckins.length) * 100)
                            return (
                                <div key={tipo} className="space-y-1">
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>{tipo}</span>
                                        <span>{count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full"
                                            style={{ width: `${pct}%`, backgroundColor: 'var(--cor-tema)' }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Lista de presentes */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                    Presentes agora ({presentes.length})
                </h2>
                {presentes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-zinc-800 rounded-2xl">
                        <Users className="w-7 h-7 text-zinc-700" />
                        <p className="text-zinc-500 text-sm">Nenhum convidado presente ainda</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-widest">Nome</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Lista</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-widest">Entrada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {presentes.map((c) => (
                                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 text-zinc-200 font-medium">
                                            {(c.guest_records as unknown as { nome: string } | null)?.nome ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            {c.lista_tipo_nome ? (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--cor-tema-subtle)', color: 'var(--cor-tema)', borderColor: 'var(--cor-tema-subtle)' }}>
                                                    {c.lista_tipo_nome}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-zinc-500">
                                            {c.timestamp_entrada
                                                ? format(new Date(c.timestamp_entrada), "HH:mm", { locale: ptBR })
                                                : '—'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
