import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return NextResponse.json(
        { error: "Erro ao buscar usuários", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: users || [], count: users?.length || 0 })
  } catch (error) {
    console.error("Erro inesperado ao buscar usuários:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    // Validações básicas
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    if (!["admin", "user", "portaria"].includes(role)) {
      return NextResponse.json(
        { error: "Cargo inválido. Valores permitidos: admin, user, portaria" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email" },
        { status: 409 }
      )
    }

    // Criar usuário
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          role,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar usuário:", error)
      return NextResponse.json(
        { error: "Erro ao criar usuário", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: newUser,
    })
  } catch (error) {
    console.error("Erro inesperado ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
