"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase, type User } from "../supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (authUser: any) => {
    if (!authUser) return null

    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        return null
      }

      console.log("Dados do usuário encontrados:", data)
      return data as User
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      return null
    }
  }

  const initAuth = async () => {
    try {
      console.log("Iniciando verificação de autenticação...")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Erro ao obter sessão:", error)
        setUser(null)
        setLoading(false)
        return
      }

      console.log("Sessão atual:", session?.user?.email || "Nenhuma sessão")

      if (session?.user) {
        const userData = await fetchUserData(session.user)
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Erro na inicialização da auth:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const handleAuthStateChange = async (event: string, session: any) => {
      console.log("Auth state changed:", event, session?.user?.email || "sem usuário")

      if (!mounted) return

      if (session?.user) {
        const userData = await fetchUserData(session.user)
        setUser(userData)
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    initAuth()

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    console.log("Tentando fazer login com:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Erro no login:", error)
      throw error
    }

    console.log("Login bem-sucedido:", data.user?.email)
  }

  const handleSignUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Erro no cadastro:", error)
      throw error
    }

    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        name,
        role: "user",
      })

      if (insertError) {
        console.error("Erro ao criar perfil:", insertError)
      }
    }
  }

  const handleSignOut = async () => {
    console.log("Fazendo logout...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erro no logout:", error)
      throw error
    }
    setUser(null)
    console.log("Logout realizado")
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Em vez de lançar erro, retorna um contexto padrão para preview
    console.warn("useAuth usado fora do AuthProvider - retornando contexto padrão")
    return {
      user: null,
      loading: false,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
    }
  }
  return context
}

export { AuthProvider, useAuth }
