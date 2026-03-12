import { createClient } from '@/lib/supabase/server'
import { HistoricoEventos } from '@/components/historico/historico-eventos'
import { History } from 'lucide-react'
import { format } from 'date-fns'

export default async function HistoricoPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user!.id)
        .single()

    const hoje = format(new Date(), 'yyyy-MM-dd')

    // Busca instâncias passadas com contagem de check-ins
    const { data: instancias } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, status')
        .eq('boate_id', profile!.boate_id)
        .lt('data_efetiva', hoje)
        .order('data_efetiva', { ascending: false })

    // Busca contagens de check-ins para cada instância passada
    const instanciaIds = (instancias ?? []).map((e) => e.id)

    let checkinCounts: Record<string, { total: number; saidas: number }> = {}

    if (instanciaIds.length > 0) {
        const { data: checkins } = await supabase
            .from('check_in_records')
            .select('evento_instancia_id, status')
            .in('evento_instancia_id', instanciaIds)

        for (const c of checkins ?? []) {
            if (!checkinCounts[c.evento_instancia_id]) {
                checkinCounts[c.evento_instancia_id] = { total: 0, saidas: 0 }
            }
            checkinCounts[c.evento_instancia_id].total++
            if (c.status === 'Saida') {
                checkinCounts[c.evento_instancia_id].saidas++
            }
        }
    }

    const eventos = (instancias ?? []).map((e) => ({
        id: e.id,
        nome: e.nome,
        data_efetiva: e.data_efetiva,
        status: e.status,
        total_checkins: checkinCounts[e.id]?.total ?? 0,
        total_saidas: checkinCounts[e.id]?.saidas ?? 0,
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                        <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Eventos passados e suas estatísticas de check-in
                        </p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground glass-card border-white/5 rounded-full px-3 py-1">
                    {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
                </span>
            </div>

            <HistoricoEventos eventos={eventos} />
        </div>
    )
}
