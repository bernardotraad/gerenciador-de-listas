'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ListaTipo {
    id: string
    nome: string
    ativo: boolean
    ordem: number
}

export async function listarListaTipos(): Promise<{ data?: ListaTipo[]; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' }

    const { data, error } = await supabase
        .from('lista_tipos')
        .select('id, nome, ativo, ordem')
        .eq('boate_id', profile.boate_id)
        .order('ordem', { ascending: true })

    if (error) return { error: error.message }
    return { data: data as ListaTipo[] }
}

export async function criarListaTipo(nome: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const nomeTrimmed = nome.trim()
    if (nomeTrimmed.length < 2) return { error: 'Nome deve ter ao menos 2 caracteres' }
    if (nomeTrimmed.length > 100) return { error: 'Nome deve ter no máximo 100 caracteres' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' }

    // Determina próxima ordem
    const { data: ultimo } = await supabase
        .from('lista_tipos')
        .select('ordem')
        .eq('boate_id', profile.boate_id)
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle()

    const proximaOrdem = (ultimo?.ordem ?? 0) + 1

    const { error } = await supabase
        .from('lista_tipos')
        .insert({ boate_id: profile.boate_id, nome: nomeTrimmed, ordem: proximaOrdem })

    if (error) return { error: error.message }

    revalidatePath('/admin/lista-tipos')
    return {}
}

export async function alternarListaTipo(id: string, ativo: boolean): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Sem boate associada' }

    const { error } = await supabase
        .from('lista_tipos')
        .update({ ativo })
        .eq('id', id)
        .eq('boate_id', profile.boate_id)

    if (error) return { error: error.message }

    revalidatePath('/admin/lista-tipos')
    return {}
}

export async function editarListaTipo(id: string, nome: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const nomeTrimmed = nome.trim()
    if (nomeTrimmed.length < 2) return { error: 'Nome deve ter ao menos 2 caracteres' }
    if (nomeTrimmed.length > 100) return { error: 'Nome deve ter no máximo 100 caracteres' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Sem boate associada' }

    const { error } = await supabase
        .from('lista_tipos')
        .update({ nome: nomeTrimmed })
        .eq('id', id)
        .eq('boate_id', profile.boate_id)

    if (error) return { error: error.message }

    revalidatePath('/admin/lista-tipos')
    return {}
}

export async function excluirListaTipo(id: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Sem boate associada' }

    const { error } = await supabase
        .from('lista_tipos')
        .delete()
        .eq('id', id)
        .eq('boate_id', profile.boate_id)

    if (error) return { error: error.message }

    revalidatePath('/admin/lista-tipos')
    return {}
}

export async function reordenarListaTipos(ordens: { id: string; ordem: number }[]): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Sem boate associada' }

    for (const { id, ordem } of ordens) {
        const { error } = await supabase
            .from('lista_tipos')
            .update({ ordem })
            .eq('id', id)
            .eq('boate_id', profile.boate_id)

        if (error) return { error: error.message }
    }

    revalidatePath('/admin/lista-tipos')
    return {}
}
