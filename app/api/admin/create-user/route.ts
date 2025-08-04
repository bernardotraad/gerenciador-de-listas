import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { isValidEmail } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { email, password, name, role } = body

    // Validações básicas
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Validação de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    // Validação de senha
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Validação de nome
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "O nome deve ter pelo menos 2 caracteres" },
        { status: 400 }
      )
    }

    // Validação de role
    const validRoles = ["admin", "user", "portaria"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Cargo inválido. Valores permitidos: ${validRoles.join(", ")}` },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email" },
        { status: 409 }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Erro ao criar usuário no Auth:", authError)
      return NextResponse.json(
        { error: "Erro ao criar conta de usuário", details: authError.message },
        { status: 500 }
      )
    }

    // Criar registro na tabela users
    const { error: dbError } = await supabaseAdmin.from("users").insert([
      {
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name.trim(),
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

      return NextResponse.json(
        { error: "Erro ao criar perfil do usuário", details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name.trim(),
        role,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Erro inesperado ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
