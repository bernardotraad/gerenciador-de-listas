import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Bootstrap — criar primeiro Admin + Boate
 *
 * Protegido por BOOTSTRAP_SECRET no .env.
 * Após uso, desative setando BOOTSTRAP_USED=true ou removendo a rota.
 *
 * Uso:
 * POST /api/bootstrap
 * Headers: { "x-bootstrap-secret": "<BOOTSTRAP_SECRET>" }
 * Body: { "email": "admin@seunome.com", "boate_nome": "Nome do Clube" }
 */
export async function POST(request: NextRequest) {
    // Guard: desabilitado em produção se BOOTSTRAP_USED estiver definido
    if (process.env.BOOTSTRAP_USED === 'true') {
        return NextResponse.json(
            { error: 'Bootstrap já foi executado. Remova BOOTSTRAP_USED do .env para reativar.' },
            { status: 403 }
        )
    }

    // Autenticação por segredo
    const secret = request.headers.get('x-bootstrap-secret')
    if (!secret || secret !== process.env.BOOTSTRAP_SECRET) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const { email, boate_nome } = body

    if (!email || !boate_nome) {
        return NextResponse.json(
            { error: 'Campos obrigatórios: email, boate_nome' },
            { status: 400 }
        )
    }

    const supabase = createServiceClient()

    // 1. Buscar usuário por email (deve ter sido criado via Supabase Auth Console)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users.find((u) => u.email === email)

    if (!authUser) {
        return NextResponse.json(
            { error: `Usuário com email "${email}" não encontrado. Crie primeiro via Supabase Auth Console.` },
            { status: 404 }
        )
    }

    // 2. Criar boate
    const { data: boate, error: boateError } = await supabase
        .from('boates')
        .insert({ nome: boate_nome, capacidade_padrao: 100 })
        .select()
        .single()

    if (boateError) {
        return NextResponse.json({ error: boateError.message }, { status: 500 })
    }

    // 3. Atualizar usuário com role Admin e boate_id
    const { error: userError } = await supabase
        .from('users')
        .update({ role: 'Admin', boate_id: boate.id })
        .eq('id', authUser.id)

    if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: `Bootstrap concluído! Admin "${email}" criado para o clube "${boate_nome}".`,
        boate_id: boate.id,
        user_id: authUser.id,
        next_step: 'Adicione BOOTSTRAP_USED=true ao .env para desabilitar este endpoint.',
    })
}
