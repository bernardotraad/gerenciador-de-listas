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
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Erro ao carregar dados do dashboard.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                    <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Bem-vindo(a), <span className="text-foreground font-medium">{profile?.nome}</span>
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
