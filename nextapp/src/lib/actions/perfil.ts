'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface MeuPerfil {
    id: string
    nome: string
    email: string
    role: 'Admin' | 'Portaria' | 'Viewer'
    avatar_url: string | null
}

export async function getMeuPerfil(): Promise<{ data?: MeuPerfil; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data, error } = await supabase
        .from('users')
        .select('id, nome, email, role, avatar_url')
        .eq('id', user.id)
        .single()

    if (error) return { error: error.message }
    return { data: data as MeuPerfil }
}

export async function editarMeuPerfil(nome: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const nomeTrimmed = nome.trim()
    if (nomeTrimmed.length < 2) return { error: 'Nome deve ter ao menos 2 caracteres' }

    const { error } = await supabase
        .from('users')
        .update({ nome: nomeTrimmed })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/perfil')
    return {}
}

export async function alterarMinhaSenha(novaSenha: string): Promise<{ error?: string }> {
    if (novaSenha.length < 6) return { error: 'Senha deve ter ao menos 6 caracteres' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) return { error: error.message }

    return {}
}

export async function atualizarMeuAvatar(avatarUrl: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/perfil')
    return {}
}
