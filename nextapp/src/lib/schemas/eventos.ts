import { z } from 'zod'

// Converte "HH:MM" em minutos desde meia-noite
function horaParaMin(hora: string): number {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
}

// Valida ordenação de horários considerando cruzamento de meia-noite
// Regra: inicio < vip_limite < fim (com possível wraparound)
function validarOrdemHorarios(
    ctx: z.RefinementCtx,
    hora_inicio: string,
    hora_fim: string,
    hora_vip_limite: string,
) {
    const inicio = horaParaMin(hora_inicio)
    let fim = horaParaMin(hora_fim)
    let vip = horaParaMin(hora_vip_limite)

    // Ajusta para cruzamento de meia-noite
    if (fim <= inicio) fim += 24 * 60
    if (vip <= inicio) vip += 24 * 60

    if (fim <= inicio) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Horário de fim deve ser após o início', path: ['hora_fim'] })
    }
    if (vip >= fim) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Limite VIP deve ser antes do fim do evento', path: ['hora_vip_limite'] })
    }
}

// Usando z.number() com valueAsNumber no form (não z.coerce) para Zod v4
export const criarEventoSchema = z.object({
    nome: z.string().min(2, 'Nome obrigatório'),
    data_referencia: z.string().min(1, 'Data obrigatória'),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    hora_fim: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    hora_vip_limite: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    capacidade: z.number().int().min(1, 'Min: 1'),
    lista_tipo_ids: z.array(z.string().uuid()).min(1, 'Selecione ao menos um tipo de lista'),
    semanas: z.number().int().min(1).max(52),
}).superRefine((data, ctx) => {
    validarOrdemHorarios(ctx, data.hora_inicio, data.hora_fim, data.hora_vip_limite)
})

export type CriarEventoInput = z.infer<typeof criarEventoSchema>

export const editarEventoSchema = z.object({
    nome: z.string().min(2, 'Nome obrigatório'),
    data_efetiva: z.string().min(1, 'Data obrigatória'),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    hora_fim: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    hora_vip_limite: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    capacidade: z.number().int().min(1, 'Min: 1'),
    lista_tipo_ids: z.array(z.string().uuid()).min(1, 'Selecione ao menos um tipo de lista'),
    escopo: z.enum(['instancia', 'futuras']),
}).superRefine((data, ctx) => {
    validarOrdemHorarios(ctx, data.hora_inicio, data.hora_fim, data.hora_vip_limite)
})

export type EditarEventoInput = z.infer<typeof editarEventoSchema>
