'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { editarEventoSchema, type EditarEventoInput } from '@/lib/schemas/eventos'
import { editarInstancia } from '@/lib/actions/eventos'

interface ListaTipoOpt {
    id: string
    nome: string
}

interface EditarEventoDialogProps {
    id: string
    nome: string
    data_efetiva: string
    hora_inicio: string
    hora_fim: string
    hora_vip_limite: string
    capacidade: number
    lista_tipo_ids_atuais: string[]
    listaTipos: ListaTipoOpt[]
}

export function EditarEventoDialog(props: EditarEventoDialogProps) {
    const [open, setOpen] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<EditarEventoInput>({
        resolver: zodResolver(editarEventoSchema),
        defaultValues: {
            nome: props.nome,
            data_efetiva: props.data_efetiva,
            hora_inicio: props.hora_inicio.slice(0, 5),
            hora_fim: props.hora_fim.slice(0, 5),
            hora_vip_limite: props.hora_vip_limite.slice(0, 5),
            capacidade: props.capacidade,
            lista_tipo_ids: props.lista_tipo_ids_atuais,
            escopo: 'instancia',
        },
    })

    function onSubmit(data: EditarEventoInput) {
        setServerError(null)
        startTransition(async () => {
            const result = await editarInstancia(props.id, data)
            if (result.error) {
                setServerError(result.error)
            } else {
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
                <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[var(--cor-tema)] transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                </button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-zinc-50">Editar Evento</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    {/* Nome */}
                    <div>
                        <label className={labelCls}>Nome do Evento</label>
                        <input {...register('nome')} className={inputCls} placeholder="Ex: Sexta VIP" />
                        {errors.nome && <p className={errorCls}>{errors.nome.message}</p>}
                    </div>

                    {/* Data */}
                    <div>
                        <label className={labelCls}>Data</label>
                        <input type="date" {...register('data_efetiva')} className={inputCls} />
                        {errors.data_efetiva && <p className={errorCls}>{errors.data_efetiva.message}</p>}
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelCls}>Início</label>
                            <input type="time" {...register('hora_inicio')} className={inputCls} />
                            {errors.hora_inicio && <p className={errorCls}>{errors.hora_inicio.message}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Fim</label>
                            <input type="time" {...register('hora_fim')} className={inputCls} />
                            {errors.hora_fim && <p className={errorCls}>{errors.hora_fim.message}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Limite VIP</label>
                            <input type="time" {...register('hora_vip_limite')} className={inputCls} />
                            {errors.hora_vip_limite && <p className={errorCls}>{errors.hora_vip_limite.message}</p>}
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
                                    {props.listaTipos.map((tipo) => {
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
                                    })}
                                </div>
                            )}
                        />
                        {errors.lista_tipo_ids && (
                            <p className={errorCls}>{errors.lista_tipo_ids.message}</p>
                        )}
                    </div>

                    {/* Escopo */}
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
                        <p className={labelCls}>Aplicar alterações em</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="instancia"
                                {...register('escopo')}
                                className="accent-[var(--cor-tema)]"
                            />
                            <span className="text-sm text-zinc-300">Somente este evento</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="futuras"
                                {...register('escopo')}
                                className="accent-[var(--cor-tema)]"
                            />
                            <span className="text-sm text-zinc-300">Este e todos os futuros</span>
                        </label>
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
                            {pending ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
