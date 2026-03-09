'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { vipDentroDoHorario, formatarHora } from '@/lib/utils/checkin-horario'

export type CheckinResult =
    | { ok: true }
    | { ok: false; bloqueado: true; motivo: string }
    | { ok: false; jaPresente: true }
    | { ok: false; erro: string }

export async function fazerCheckin(
    guestId: string,
    eventoInstanciaId: string
): Promise<CheckinResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, erro: 'Não autenticado' }

    const { data: evento } = await supabase
        .from('eventos_instancia')
        .select('hora_inicio, hora_fim, hora_vip_limite')
        .eq('id', eventoInstanciaId)
        .single()

    if (!evento) return { ok: false, erro: 'Evento não encontrado' }

    // Verifica se já fez check-in
    const { data: existing } = await supabase
        .from('check_in_records')
        .select('id')
        .eq('guest_id', guestId)
        .eq('evento_instancia_id', eventoInstanciaId)
        .eq('status', 'Presente')
        .maybeSingle()

    if (existing) return { ok: false, jaPresente: true }

    // Busca tipo de lista do convidado (snapshot do nome)
    const { data: guest } = await supabase
        .from('guest_records')
        .select('lista_tipo_id, lista_tipos ( nome )')
        .eq('id', guestId)
        .single()

    const listaTipoNome = (guest?.lista_tipos as unknown as { nome: string } | null)?.nome ?? null

    // Validação de horário VIP: aplica se o nome do tipo contém "VIP"
    if (listaTipoNome?.toUpperCase().includes('VIP')) {
        const permitido = vipDentroDoHorario(evento.hora_inicio, evento.hora_vip_limite)
        if (!permitido) {
            return {
                ok: false,
                bloqueado: true,
                motivo: `VIP permitido até ${formatarHora(evento.hora_vip_limite)}`,
            }
        }
    }

    const { error } = await supabase
        .from('check_in_records')
        .insert({
            guest_id: guestId,
            evento_instancia_id: eventoInstanciaId,
            horario_evento_inicio: evento.hora_inicio,
            horario_evento_fim: evento.hora_fim,
            horario_vip_limite: evento.hora_vip_limite,
            lista_tipo_nome: listaTipoNome,
            portaria_user_id: user.id,
            status: 'Presente',
        })

    if (error) return { ok: false, erro: error.message }

    revalidatePath('/portaria')
    return { ok: true }
}

export async function fazerSaida(checkinId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
        .from('check_in_records')
        .update({ status: 'Saida' })
        .eq('id', checkinId)

    if (error) return { error: error.message }

    revalidatePath('/portaria')
    return { success: true }
}
