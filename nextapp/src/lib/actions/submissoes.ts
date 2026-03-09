'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { submissaoSchema, parseNomes, type SubmissaoInput } from '@/lib/schemas/submissoes'

// ─── Pública (anon) ──────────────────────────────────────────────────────────

export async function criarSubmissao(input: SubmissaoInput) {
    const parsed = submissaoSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    // Usa service client para bypassar RLS no INSERT público
    const supabase = createServiceClient()

    // Rate limiting: máx 10 submissões por IP por hora
    const headersList = await headers()
    const ip =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        headersList.get('x-real-ip') ??
        'unknown'

    const umHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
        .from('guest_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submission_ip', ip)
        .gte('created_at', umHoraAtras)

    if ((count ?? 0) >= 10) {
        return { error: 'Limite de 10 submissões por hora atingido. Tente novamente mais tarde.' }
    }

    // Valida que o evento existe e está ativo
    const { data: evento } = await supabase
        .from('eventos_instancia')
        .select('id, status')
        .eq('id', data.evento_instancia_id)
        .eq('status', 'Ativo')
        .single()

    if (!evento) return { error: 'Evento não encontrado ou inativo.' }

    // Valida que o lista_tipo_id pertence ao evento selecionado
    const { data: junctionCheck } = await supabase
        .from('evento_lista_tipos')
        .select('lista_tipo_id')
        .eq('evento_instancia_id', data.evento_instancia_id)
        .eq('lista_tipo_id', data.lista_tipo_id)
        .maybeSingle()

    if (!junctionCheck) return { error: 'Tipo de lista inválido para este evento.' }

    const parseResult = parseNomes(data.raw_text)
    if (parseResult.names.length === 0) return { error: 'Nenhum nome válido encontrado.' }

    const { error } = await supabase
        .from('guest_submissions')
        .insert({
            evento_instancia_id: data.evento_instancia_id,
            lista_tipo_id: data.lista_tipo_id,
            submitter_label: data.submitter_label,
            submitter_email: data.submitter_email,
            raw_text: data.raw_text,
            parsed_names: parseResult.names,
            status: 'Pendente',
            submission_ip: ip,
        })

    if (error) return { error: error.message }

    return { success: true, count: parseResult.names.length }
}

// ─── Usuário logado (aprovação automática) ───────────────────────────────────

export async function criarSubmissaoLogada(input: SubmissaoInput) {
    const parsed = submissaoSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const data = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('role, boate_id')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Admin' && profile?.role !== 'Portaria') {
        return { error: 'Sem permissão' }
    }

    const svc = createServiceClient()

    const { data: evento } = await svc
        .from('eventos_instancia')
        .select('id, status')
        .eq('id', data.evento_instancia_id)
        .eq('status', 'Ativo')
        .single()
    if (!evento) return { error: 'Evento não encontrado ou inativo.' }

    const { data: junctionCheck } = await svc
        .from('evento_lista_tipos')
        .select('lista_tipo_id')
        .eq('evento_instancia_id', data.evento_instancia_id)
        .eq('lista_tipo_id', data.lista_tipo_id)
        .maybeSingle()
    if (!junctionCheck) return { error: 'Tipo de lista inválido para este evento.' }

    const parseResult = parseNomes(data.raw_text)
    if (parseResult.names.length === 0) return { error: 'Nenhum nome válido encontrado.' }

    const { data: sub, error: subErr } = await supabase
        .from('guest_submissions')
        .insert({
            evento_instancia_id: data.evento_instancia_id,
            lista_tipo_id: data.lista_tipo_id,
            submitter_label: data.submitter_label,
            submitter_email: data.submitter_email,
            raw_text: data.raw_text,
            parsed_names: parseResult.names,
            status: 'Aprovado',
            submission_ip: 'internal',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
        })
        .select('id')
        .single()

    if (subErr) return { error: subErr.message }

    const records = parseResult.names.map((nome) => ({
        evento_instancia_id: data.evento_instancia_id,
        submission_id: sub.id,
        nome,
        lista_tipo_id: data.lista_tipo_id,
        source: 'Submission' as const,
        status: 'Aprovado' as const,
        added_by: user.id,
    }))

    const { error: recErr } = await supabase
        .from('guest_records')
        .insert(records)

    if (recErr) return { error: recErr.message }

    revalidatePath('/admin/submissoes')
    return { success: true, count: parseResult.names.length }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function aprovarSubmissao(id: string, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'Admin') return { error: 'Sem permissão' }

    // Busca a submission
    const { data: sub } = await supabase
        .from('guest_submissions')
        .select('id, evento_instancia_id, parsed_names, lista_tipo_id')
        .eq('id', id)
        .single()

    if (!sub) return { error: 'Submissão não encontrada' }

    const nomes = (sub.parsed_names as string[]) ?? []

    // Cria guest_records com lista_tipo_id
    if (nomes.length > 0) {
        const records = nomes.map((nome) => ({
            evento_instancia_id: sub.evento_instancia_id,
            submission_id: sub.id,
            nome,
            lista_tipo_id: sub.lista_tipo_id ?? null,
            source: 'Submission' as const,
            status: 'Aprovado' as const,
            added_by: user.id,
        }))

        const { error: recErr } = await supabase
            .from('guest_records')
            .insert(records)

        if (recErr) return { error: recErr.message }
    }

    // Atualiza status da submission
    const { error } = await supabase
        .from('guest_submissions')
        .update({
            status: 'Aprovado',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes ?? null,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/submissoes')
    return { success: true }
}

export async function rejeitarSubmissao(id: string, notes: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'Admin') return { error: 'Sem permissão' }

    const { error } = await supabase
        .from('guest_submissions')
        .update({
            status: 'Rejeitado',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/submissoes')
    return { success: true }
}
