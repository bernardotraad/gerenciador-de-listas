'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Users, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { CancelarInstanciaButton } from './cancelar-instancia-button'
import { EditarEventoDialog } from './editar-evento-dialog'
import { DeletarEventoButton } from './DeletarEventoButton'

type EventoStatus = 'Ativo' | 'Cancelado' | 'Finalizado'

interface ListaTipoOpt {
    id: string
    nome: string
}

interface EventoCardProps {
    id: string
    nome: string
    data_efetiva: string
    hora_inicio: string
    hora_fim: string
    hora_vip_limite: string
    capacidade: number
    semana_numero: number | null
    status: EventoStatus
    template_id: string | null
    listaTipos: ListaTipoOpt[]
    todosListaTipos: ListaTipoOpt[]
}

const STATUS_BADGE: Record<EventoStatus, string> = {
    Ativo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Cancelado: 'bg-red-500/15 text-red-400 border-red-500/30',
    Finalizado: 'bg-muted/50 text-muted-foreground border-border',
}

export function EventoCard(props: EventoCardProps) {
    const data = parseISO(props.data_efetiva)
    const diaSemana = format(data, 'EEEE', { locale: ptBR })
    const dataFormatada = format(data, "dd 'de' MMMM", { locale: ptBR })
    const cancelado = props.status === 'Cancelado'

    return (
        <div className={`glass-card border rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 ${
            cancelado || props.status === 'Finalizado'
                ? 'border-white/5 opacity-60'
                : 'border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-black/20'
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground capitalize">{diaSemana}</p>
                    <h3 className="font-semibold text-foreground truncate">{props.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{dataFormatada}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[props.status]}`}>
                        {props.status}
                    </span>
                    {props.semana_numero && (
                        <span className="text-muted-foreground text-xs">Sem. {props.semana_numero}</span>
                    )}
                </div>
            </div>

            {/* Tipos de lista */}
            {props.listaTipos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {props.listaTipos.map((tipo) => (
                        <span
                            key={tipo.id}
                            className="text-xs font-medium px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary"
                        >
                            {tipo.nome}
                        </span>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {props.hora_inicio.slice(0, 5)} – {props.hora_fim.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {props.capacidade} vagas
                </span>
            </div>

            {/* Actions */}
            {cancelado ? (
                <div className="pt-1 border-t border-border flex gap-4">
                    <DeletarEventoButton id={props.id} />
                </div>
            ) : (
                <div className="pt-1 border-t border-border flex gap-4 flex-wrap">
                    <Link
                        href={`/admin/eventos/${props.id}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Overview
                    </Link>
                    <EditarEventoDialog
                        id={props.id}
                        nome={props.nome}
                        data_efetiva={props.data_efetiva}
                        hora_inicio={props.hora_inicio}
                        hora_fim={props.hora_fim}
                        hora_vip_limite={props.hora_vip_limite}
                        capacidade={props.capacidade}
                        lista_tipo_ids_atuais={props.listaTipos.map((t) => t.id)}
                        listaTipos={props.todosListaTipos}
                    />
                    <CancelarInstanciaButton id={props.id} />
                </div>
            )}
        </div>
    )
}
