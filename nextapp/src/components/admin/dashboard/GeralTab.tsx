import { KpiCards } from './KpiCards'
import { CheckinsLineChart } from './charts/CheckinsLineChart'
import { SubmissoesFunnelChart } from './charts/SubmissoesFunnelChart'
import { ListaTipoDonutChart } from './charts/ListaTipoDonutChart'

interface Props {
    data: {
        kpis: {
            eventosAtivos: number | null
            convidadosAprovados: number | null
            submissoesPendentes: number | null
            checkinsHoje: number | null
        }
        checkinsLinha: { data: string; total: number }[]
        funilData: { nome: string; total: number }[]
        tipoData: { nome: string; total: number }[]
    }
}

export function GeralTab({ data }: Props) {
    return (
        <div className="space-y-6">
            <KpiCards kpis={data.kpis} />

            <CheckinsLineChart data={data.checkinsLinha} label="Check-ins — últimos 30 dias" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SubmissoesFunnelChart data={data.funilData} />
                <ListaTipoDonutChart data={data.tipoData} />
            </div>
        </div>
    )
}
