import { format, startOfWeek, addDays } from 'date-fns'
import { LayoutDashboard } from 'lucide-react'
import {
    getDashboardGeral,
    getDashboardSemana,
    getDashboardMes,
    getDashboardEvento,
    getEventosDisponiveis,
} from '@/lib/actions/dashboard'
import { DashboardTabs } from '@/components/admin/dashboard/DashboardTabs'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('users')
        .select('nome')
        .eq('id', user!.id)
        .single()

    const hoje = new Date()
    const semanaInicio = format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const mes = hoje.getMonth() + 1
    const ano = hoje.getFullYear()

    const [geralData, semanaData, mesData, eventos] = await Promise.all([
        getDashboardGeral(),
        getDashboardSemana(semanaInicio),
        getDashboardMes(mes, ano),
        getEventosDisponiveis(),
    ])

    // Pre-carrega o evento mais recente na tab de evento
    const primeiroEvento = eventos[0] ?? null
    const primeiroEventoData = primeiroEvento
        ? await getDashboardEvento(primeiroEvento.id)
        : null

    if (!geralData || !semanaData || !mesData) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500">
                Erro ao carregar dados do dashboard.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--cor-tema-subtle)' }}>
                    <LayoutDashboard className="w-5 h-5" style={{ color: 'var(--cor-tema)' }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">
                        Bem-vindo, <span className="text-zinc-200 font-medium">{profile?.nome}</span>
                    </p>
                </div>
            </div>

            <DashboardTabs
                geralData={geralData}
                semanaData={semanaData}
                semanaInicio={semanaInicio}
                mesData={mesData}
                mes={mes}
                ano={ano}
                eventos={eventos}
                primeiroEventoId={primeiroEvento?.id ?? null}
                primeiroEventoData={primeiroEventoData}
            />
        </div>
    )
}
