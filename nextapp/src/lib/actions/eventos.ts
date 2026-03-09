'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addDays, format, subDays } from 'date-fns'
import { criarEventoSchema, editarEventoSchema, type CriarEventoInput, type EditarEventoInput } from '@/lib/schemas/eventos'

export async function criarEvento(input: CriarEventoInput) {
    const parsed = criarEventoSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' }

    const boate_id = profile.boate_id

    const { data: template, error: tplError } = await supabase
        .from('eventos_template')
        .insert({
            boate_id,
            admin_id: user.id,
            nome: data.nome,
            data_referencia: data.data_referencia,
            hora_inicio: data.hora_inicio,
            hora_fim: data.hora_fim,
            hora_vip_limite: data.hora_vip_limite,
            capacidade: data.capacidade,
            status: 'Ativo',
        })
        .select('id')
        .single()

    if (tplError || !template) {
        return { error: tplError?.message ?? 'Erro ao criar template' }
    }

    const instancias = Array.from({ length: data.semanas }, (_, i) => ({
        template_id: template.id,
        boate_id,
        nome: data.nome,
        data_efetiva: format(
            addDays(new Date(data.data_referencia + 'T12:00:00'), i * 7),
            'yyyy-MM-dd'
        ),
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        hora_vip_limite: data.hora_vip_limite,
        capacidade: data.capacidade,
        semana_numero: i + 1,
        status: 'Ativo',
    }))

    const { data: instanciasCriadas, error: instError } = await supabase
        .from('eventos_instancia')
        .insert(instancias)
        .select('id')

    if (instError || !instanciasCriadas) return { error: instError?.message ?? 'Erro ao criar instâncias' }

    // Insere relacionamentos evento_lista_tipos para cada instância × cada tipo
    const junctions = instanciasCriadas.flatMap((inst) =>
        data.lista_tipo_ids.map((lista_tipo_id) => ({
            evento_instancia_id: inst.id,
            lista_tipo_id,
        }))
    )

    const { error: junctionError } = await supabase
        .from('evento_lista_tipos')
        .insert(junctions)

    if (junctionError) return { error: junctionError.message }

    revalidatePath('/admin/eventos')
    return { success: true }
}

export async function editarInstancia(id: string, input: EditarEventoInput) {
    const parsed = editarEventoSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    // Busca instância atual para obter template_id e data_efetiva original
    const { data: instancia, error: fetchError } = await supabase
        .from('eventos_instancia')
        .select('template_id, data_efetiva')
        .eq('id', id)
        .single()

    if (fetchError || !instancia) return { error: 'Instância não encontrada' }

    const camposInstancia = {
        nome: data.nome,
        data_efetiva: data.data_efetiva,
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        hora_vip_limite: data.hora_vip_limite,
        capacidade: data.capacidade,
    }

    // Atualiza esta instância
    const { error: updateError } = await supabase
        .from('eventos_instancia')
        .update(camposInstancia)
        .eq('id', id)

    if (updateError) return { error: updateError.message }

    // Atualiza lista_tipos desta instância
    await supabase.from('evento_lista_tipos').delete().eq('evento_instancia_id', id)
    const novosJunctions = data.lista_tipo_ids.map((lista_tipo_id) => ({
        evento_instancia_id: id,
        lista_tipo_id,
    }))
    const { error: jErr } = await supabase.from('evento_lista_tipos').insert(novosJunctions)
    if (jErr) return { error: jErr.message }

    if (data.escopo === 'futuras' && instancia.template_id) {
        const dataOriginal = instancia.data_efetiva

        // Busca instâncias futuras do mesmo template
        const { data: futuras } = await supabase
            .from('eventos_instancia')
            .select('id')
            .eq('template_id', instancia.template_id)
            .neq('id', id)
            .gt('data_efetiva', dataOriginal)
            .neq('status', 'Cancelado')

        const camposFuturas = {
            nome: data.nome,
            hora_inicio: data.hora_inicio,
            hora_fim: data.hora_fim,
            hora_vip_limite: data.hora_vip_limite,
            capacidade: data.capacidade,
        }

        await supabase
            .from('eventos_instancia')
            .update(camposFuturas)
            .eq('template_id', instancia.template_id)
            .neq('id', id)
            .gt('data_efetiva', dataOriginal)
            .neq('status', 'Cancelado')

        // Atualiza lista_tipos das instâncias futuras
        if (futuras && futuras.length > 0) {
            const futuraIds = futuras.map((f) => f.id)
            await supabase
                .from('evento_lista_tipos')
                .delete()
                .in('evento_instancia_id', futuraIds)

            const futurasJunctions = futuras.flatMap((f) =>
                data.lista_tipo_ids.map((lista_tipo_id) => ({
                    evento_instancia_id: f.id,
                    lista_tipo_id,
                }))
            )
            await supabase.from('evento_lista_tipos').insert(futurasJunctions)
        }

        // Atualiza o template
        await supabase
            .from('eventos_template')
            .update(camposFuturas)
            .eq('id', instancia.template_id)
    }

    revalidatePath('/admin/eventos')
    return { success: true }
}

export async function cancelarInstancia(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
        .from('eventos_instancia')
        .update({ status: 'Cancelado' })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/eventos')
    return { success: true }
}

export async function deletarInstancia(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: instancia } = await supabase
        .from('eventos_instancia')
        .select('id, status')
        .eq('id', id)
        .single()

    if (!instancia) return { error: 'Evento não encontrado' }
    if (instancia.status !== 'Cancelado') return { error: 'Só é possível deletar eventos cancelados' }

    const { error } = await supabase
        .from('eventos_instancia')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/eventos')
    return { success: true }
}

export async function cancelarTemplate(templateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const today = format(new Date(), 'yyyy-MM-dd')
    const { error } = await supabase
        .from('eventos_instancia')
        .update({ status: 'Cancelado' })
        .eq('template_id', templateId)
        .eq('status', 'Ativo')
        .gte('data_efetiva', today)

    if (error) return { error: error.message }

    await supabase
        .from('eventos_template')
        .update({ status: 'Inativo' })
        .eq('id', templateId)

    revalidatePath('/admin/eventos')
    return { success: true }
}

export async function finalizarEventosPassados(): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const agora = new Date()
    const hoje = format(agora, 'yyyy-MM-dd')
    const ontem = format(subDays(agora, 1), 'yyyy-MM-dd')
    const horaAtual = format(agora, 'HH:mm:ss')

    // Caso 1: eventos com data anterior a ontem — sempre finalizados
    await supabase
        .from('eventos_instancia')
        .update({ status: 'Finalizado' })
        .eq('status', 'Ativo')
        .lt('data_efetiva', ontem)

    // Caso 2: eventos de ontem
    // - Sem cruzamento de meia-noite (hora_fim >= hora_inicio): já terminaram ontem → finalizar
    // - Com cruzamento de meia-noite (hora_fim < hora_inicio): terminam hoje → finalizar só se horaAtual >= hora_fim
    const { data: eventosOntem } = await supabase
        .from('eventos_instancia')
        .select('id, hora_inicio, hora_fim')
        .eq('status', 'Ativo')
        .eq('data_efetiva', ontem)

    const idsOntem = (eventosOntem ?? [])
        .filter(e => {
            const cruzaMeiaNoite = e.hora_fim < e.hora_inicio
            if (!cruzaMeiaNoite) return true          // terminou ontem → finalizar
            return horaAtual >= e.hora_fim             // termina hoje → finalizar só após hora_fim
        })
        .map(e => e.id)

    if (idsOntem.length > 0) {
        await supabase
            .from('eventos_instancia')
            .update({ status: 'Finalizado' })
            .in('id', idsOntem)
    }

    // Caso 3: eventos de hoje sem cruzamento de meia-noite que já passaram do hora_fim
    const { data: eventosHoje } = await supabase
        .from('eventos_instancia')
        .select('id, hora_inicio, hora_fim')
        .eq('status', 'Ativo')
        .eq('data_efetiva', hoje)

    const idsHoje = (eventosHoje ?? [])
        .filter(e => e.hora_fim > e.hora_inicio && horaAtual > e.hora_fim)
        .map(e => e.id)

    if (idsHoje.length > 0) {
        await supabase
            .from('eventos_instancia')
            .update({ status: 'Finalizado' })
            .in('id', idsHoje)
    }
}
