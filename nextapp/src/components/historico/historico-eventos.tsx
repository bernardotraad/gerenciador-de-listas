'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Search, Users, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface EventoHistorico {
    id: string
    nome: string
    data_efetiva: string
    status: string
    total_checkins: number
    total_saidas: number
}

interface Props {
    eventos: EventoHistorico[]
}

export function HistoricoEventos({ eventos }: Props) {
    const [busca, setBusca] = useState('')
    const [mesFiltro, setMesFiltro] = useState('')

    // Meses disponíveis
    const mesesDisponiveis = Array.from(
        new Set(eventos.map((e) => e.data_efetiva.slice(0, 7)))
    ).sort().reverse()

    const filtrados = eventos.filter((e) => {
        const matchBusca = busca === '' || e.nome.toLowerCase().includes(busca.toLowerCase())
        const matchMes = mesFiltro === '' || e.data_efetiva.startsWith(mesFiltro)
        return matchBusca && matchMes
    })

    return (
        <div className="space-y-5">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar evento..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>
                <select
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                    <option value="">Todos os meses</option>
                    {mesesDisponiveis.map((mes) => {
                        const [ano, m] = mes.split('-')
                        const label = format(new Date(Number(ano), Number(m) - 1, 1), 'MMMM yyyy', { locale: ptBR })
                        return (
                            <option key={mes} value={mes}>
                                {label.charAt(0).toUpperCase() + label.slice(1)}
                            </option>
                        )
                    })}
                </select>
            </div>

            {/* Resultados */}
            {filtrados.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 border border-dashed border-border rounded-2xl">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Nenhum evento encontrado</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtrados.map((e) => {
                        const data = parseISO(e.data_efetiva)
                        const presentes = e.total_checkins - e.total_saidas
                        return (
                            <div
                                key={e.id}
                                className="glass-card border-white/5 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="shrink-0 text-center hidden sm:block">
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {format(data, 'MMM', { locale: ptBR })}
                                        </p>
                                        <p className="text-xl font-bold text-foreground leading-none">
                                            {format(data, 'dd')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(data, 'yyyy')}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-foreground font-semibold truncate">{e.nome}</p>
                                        <p className="text-xs text-muted-foreground sm:hidden">
                                            {format(data, "dd/MM/yyyy")}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="w-3 h-3" />
                                                {e.total_checkins} check-ins
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <CheckCircle className="w-3 h-3" />
                                                {presentes > 0 ? presentes : 0} presentes
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border hidden sm:inline ${
                                        e.status === 'Finalizado'
                                            ? 'bg-muted/50 text-muted-foreground border-border'
                                            : e.status === 'Cancelado'
                                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                        {e.status}
                                    </span>
                                    <Link
                                        href={`/admin/eventos/${e.id}`}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                        title="Ver detalhes"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
                {filtrados.length} evento{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </p>
        </div>
    )
}
