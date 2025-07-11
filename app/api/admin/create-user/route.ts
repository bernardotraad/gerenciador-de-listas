import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, password, name, role } = await request.json()

    // Validações básicas
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    if (!["admin", "user", "portaria"].includes(role)) {
      return NextResponse.json({ error: "Cargo inválido" }, { status: 400 })
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "Já existe um usuário com este email" }, { status: 409 })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Erro ao criar usuário no Auth:", authError)
      return NextResponse.json({ error: "Erro ao criar conta de usuário: " + authError.message }, { status: 500 })
    }

    // Criar registro na tabela users
    const { error: dbError } = await supabaseAdmin.from("users").insert([
      {
        id: authData.user.id,
        email,
        name,
        role,
      },
    ])

    if (dbError) {
      console.error("Erro ao criar registro na tabela users:", dbError)

      // Tentar deletar do Auth para manter consistência
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Erro ao limpar usuário do Auth:", cleanupError)
      }

      return NextResponse.json({ error: "Erro ao criar perfil do usuário" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role,
      },
    })
  } catch (error) {
    console.error("Erro inesperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
