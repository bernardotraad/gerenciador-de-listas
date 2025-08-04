"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { CustomUser } from "./supabase"

interface AuthContextType {
  user: User | null
  customUser: CustomUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [customUser, setCustomUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomUser = async (authUser: User) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", authUser.email).single()

      if (error) {
        console.error("Erro ao buscar usuário customizado:", error)
        // Se o usuário não existe na tabela users, criar um
        if (error.code === "PGRST116") {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert([
              {
                id: authUser.id,
                email: authUser.email!,
                name: authUser.user_metadata?.name || authUser.email!.split("@")[0],
                role: authUser.email === "bernardotraad@gmail.com" ? "admin" : "user",
              },
            ])
            .select()
            .single()

          if (insertError) {
            console.error("Erro ao criar usuário:", insertError)
            return null
          }
          return newUser as CustomUser
        }
        return null
      }

      return data as CustomUser
    } catch (error) {
      console.error("Erro inesperado ao buscar usuário:", error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const customUserData = await fetchCustomUser(session.user)
        setCustomUser(customUserData)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const customUserData = await fetchCustomUser(session.user)
        setCustomUser(customUserData)
      } else {
        setCustomUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, customUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
