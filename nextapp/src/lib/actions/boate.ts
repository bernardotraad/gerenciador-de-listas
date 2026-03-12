'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface BoateSettings {
    id: string
    nome: string
    logo_url: string | null
    capacidade_padrao: number
}

export async function getBoateSettings(): Promise<{ data?: BoateSettings; error?: string }> {
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
        .from('boates')
        .select('id, nome, logo_url, capacidade_padrao')
        .eq('id', profile.boate_id)
        .single()

    if (error) return { error: error.message }
    return { data: data as BoateSettings }
}

export async function atualizarBoate(
    updates: { nome?: string; capacidade_padrao?: number }
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' }
    if (profile.role !== 'Admin') return { error: 'Permissão negada' }

    const { error } = await supabase
        .from('boates')
        .update(updates)
        .eq('id', profile.boate_id)

    if (error) return { error: error.message }

    revalidatePath('/admin', 'layout')
    revalidatePath('/portaria', 'layout')
    revalidatePath('/perfil', 'layout')
    return {}
}

export async function atualizarLogoUrl(logoUrl: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' }
    if (profile.role !== 'Admin') return { error: 'Permissão negada' }

    const { error } = await supabase
        .from('boates')
        .update({ logo_url: logoUrl })
        .eq('id', profile.boate_id)

    if (error) return { error: error.message }

    revalidatePath('/admin', 'layout')
    revalidatePath('/portaria', 'layout')
    revalidatePath('/perfil', 'layout')
    revalidatePath('/admin/configuracoes')
    return {}
}
