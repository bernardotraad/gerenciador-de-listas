'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface Usuario {
    id: string
    email: string
    nome: string
    role: 'Admin' | 'Portaria' | 'Viewer'
    status: 'Ativo' | 'Inativo'
    created_at: string
}

async function getAdminProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' as const }

    const { data: profile } = await supabase
        .from('users')
        .select('boate_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.boate_id) return { error: 'Admin sem boate associada' as const }
    if (profile.role !== 'Admin') return { error: 'Permissão negada' as const }

    return { userId: user.id, boateId: profile.boate_id as string, supabase }
}

export async function listarUsuarios(): Promise<{ data?: Usuario[]; error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { supabase, boateId } = result

    const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role, status, created_at')
        .eq('boate_id', boateId)
        .order('created_at', { ascending: true })

    if (error) return { error: error.message }
    return { data: data as Usuario[] }
}

export async function criarUsuario(
    email: string,
    nome: string,
    role: 'Admin' | 'Portaria',
    senha: string
): Promise<{ error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { boateId } = result

    const service = createServiceClient()

    const { data: authData, error: authError } = await service.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
    })

    if (authError) return { error: authError.message }

    const { error: updateError } = await service
        .from('users')
        .update({ boate_id: boateId, nome, role })
        .eq('id', authData.user.id)

    if (updateError) {
        await service.auth.admin.deleteUser(authData.user.id)
        await service.from('users').delete().eq('id', authData.user.id)
        return { error: updateError.message }
    }

    revalidatePath('/admin/usuarios')
    return {}
}

export async function editarUsuario(
    id: string,
    updates: { nome?: string; role?: 'Admin' | 'Portaria' }
): Promise<{ error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { userId, supabase, boateId } = result

    if (id === userId) return { error: 'Não é possível editar o próprio usuário' }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .eq('boate_id', boateId)

    if (error) return { error: error.message }

    revalidatePath('/admin/usuarios')
    return {}
}

export async function alternarStatusUsuario(
    id: string,
    status: 'Ativo' | 'Inativo'
): Promise<{ error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { userId, supabase, boateId } = result

    if (id === userId) return { error: 'Não é possível desativar o próprio usuário' }

    const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id)
        .eq('boate_id', boateId)

    if (error) return { error: error.message }

    revalidatePath('/admin/usuarios')
    return {}
}

export async function excluirUsuario(id: string): Promise<{ error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { userId, supabase, boateId } = result

    if (id === userId) return { error: 'Não é possível excluir o próprio usuário' }

    const { data: target } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .eq('boate_id', boateId)
        .maybeSingle()

    if (!target) return { error: 'Usuário não encontrado' }

    const service = createServiceClient()
    const { error } = await service.auth.admin.deleteUser(id)
    if (error && !error.message.toLowerCase().includes('not found')) {
        return { error: error.message }
    }

    // Se o usuário não existia no Auth, deleta da tabela manualmente
    if (error) {
        await service.from('users').delete().eq('id', id)
    }

    revalidatePath('/admin/usuarios')
    return {}
}

export async function alterarSenhaUsuario(
    id: string,
    novaSenha: string
): Promise<{ error?: string }> {
    const result = await getAdminProfile()
    if ('error' in result) return { error: result.error }
    const { userId, supabase, boateId } = result

    if (id === userId) return { error: 'Use a página de Perfil para alterar sua própria senha' }

    const { data: target } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .eq('boate_id', boateId)
        .maybeSingle()

    if (!target) return { error: 'Usuário não encontrado' }

    const service = createServiceClient()
    const { error } = await service.auth.admin.updateUserById(id, { password: novaSenha })
    if (error) return { error: error.message }

    return {}
}
