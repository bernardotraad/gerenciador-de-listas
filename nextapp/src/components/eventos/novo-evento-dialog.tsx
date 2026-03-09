'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Plus, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { criarEventoSchema, type CriarEventoInput } from '@/lib/schemas/eventos'
import { criarEvento } from '@/lib/actions/eventos'

interface ListaTipoOpt {
    id: string
    nome: string
}

interface NovoEventoDialogProps {
    listaTipos: ListaTipoOpt[]
}

export function NovoEventoDialog({ listaTipos }: NovoEventoDialogProps) {
    const [open, setOpen] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<CriarEventoInput>({
        resolver: zodResolver(criarEventoSchema),
        defaultValues: {
            hora_inicio: '22:00',
            hora_fim: '04:00',
            hora_vip_limite: '23:00',
            capacidade: 100,
            lista_tipo_ids: [],
            semanas: 8,
            data_referencia: format(new Date(), 'yyyy-MM-dd'),
        },
    })

    function onSubmit(data: CriarEventoInput) {
        setServerError(null)
        startTransition(async () => {
            const result = await criarEvento(data)
            if (result.error) {
                setServerError(result.error)
            } else {
                reset()
                setOpen(false)
            }
        })
    }

    const inputCls = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cor-tema)] focus:border-transparent transition-all placeholder-zinc-500"
    const labelCls = "block text-xs font-medium text-zinc-400 mb-1"
    const errorCls = "text-red-400 text-xs mt-1"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] text-white text-sm font-semibold rounded-lg transition-colors shadow-lg">
                    <Plus className="w-4 h-4" />
                    Novo Evento
                </button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-zinc-50">Criar Evento Recorrente</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    {/* Nome */}
                    <div>
                        <label className={labelCls}>Nome do Evento</label>
                        <input {...register('nome')} className={inputCls} placeholder="Ex: Sexta VIP" />
                        {errors.nome && <p className={errorCls}>{errors.nome.message}</p>}
                    </div>

                    {/* Data + Semanas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Data de Início</label>
                            <input type="date" {...register('data_referencia')} className={inputCls} />
                            {errors.data_referencia && <p className={errorCls}>{errors.data_referencia.message}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Semanas a gerar</label>
                            <input type="number" {...register('semanas', { valueAsNumber: true })} min={1} max={52} className={inputCls} />
                            {errors.semanas && <p className={errorCls}>{errors.semanas.message}</p>}
                        </div>
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelCls}>Início</label>
                            <input type="time" {...register('hora_inicio')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Fim</label>
                            <input type="time" {...register('hora_fim')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Limite VIP</label>
                            <input type="time" {...register('hora_vip_limite')} className={inputCls} />
                        </div>
                    </div>

                    {/* Capacidade */}
                    <div className="w-1/2">
                        <label className={labelCls}>Capacidade</label>
                        <input type="number" {...register('capacidade', { valueAsNumber: true })} min={1} className={inputCls} />
                        {errors.capacidade && <p className={errorCls}>{errors.capacidade.message}</p>}
                    </div>

                    {/* Tipos de Lista */}
                    <div>
                        <label className={labelCls}>Tipos de lista</label>
                        <Controller
                            control={control}
                            name="lista_tipo_ids"
                            render={({ field }) => (
                                <div className="space-y-1.5">
                                    {listaTipos.length === 0 ? (
                                        <p className="text-zinc-500 text-xs">
                                            Nenhum tipo de lista ativo. Crie tipos em{' '}
                                            <span style={{ color: 'var(--cor-tema)' }}>Tipos de Lista</span>.
                                        </p>
                                    ) : (
                                        listaTipos.map((tipo) => {
                                            const checked = field.value.includes(tipo.id)
                                            return (
                                                <label
                                                    key={tipo.id}
                                                    className="flex items-center gap-2.5 cursor-pointer group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const next = e.target.checked
                                                                ? [...field.value, tipo.id]
                                                                : field.value.filter((v) => v !== tipo.id)
                                                            field.onChange(next)
                                                        }}
                                                        className="accent-[var(--cor-tema)] w-4 h-4 rounded"
                                                    />
                                                    <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                                        {tipo.nome}
                                                    </span>
                                                </label>
                                            )
                                        })
                                    )}
                                </div>
                            )}
                        />
                        {errors.lista_tipo_ids && (
                            <p className={errorCls}>{errors.lista_tipo_ids.message}</p>
                        )}
                    </div>

                    {/* Server error */}
                    {serverError && (
                        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                            {serverError}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="flex items-center gap-2 px-4 py-2 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {pending ? 'Criando...' : 'Criar Evento'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
