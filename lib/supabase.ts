import { createClient } from "@supabase/supabase-js"

// Cliente público (pode rodar em qualquer lado)
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Somente servidor ➜ cria quando PRECISAR da Service Role
export function getSupabaseAdmin() {
  /**
   * Em ambientes de execução estritamente server-side (Vercel Functions),
   * `window` não existe. Contudo, no Next.js (preview) os arquivos em `app/api`
   * rodam no mesmo runtime do navegador e `window` está definido.
   *
   * Para permitir o preview sem erros, só bloqueamos em produção
   * (process.env.NODE_ENV === "production").
   */
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    throw new Error("getSupabaseAdmin deve ser chamado apenas no servidor em produção")
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definido")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Tipos TypeScript
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "portaria"
  created_at: string
}

export interface Event {
  id: string
  name: string
  description?: string
  date: string
  time?: string
  max_capacity: number
  status: "active" | "inactive" | "finished"
  created_by: string
  created_at: string
}

export interface ListType {
  id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
}

export interface Sector {
  id: string
  name: string
  description?: string
  capacity: number
  color: string
  is_active: boolean
  created_at: string
}

export interface EventList {
  id: string
  event_id: string
  list_type_id: string
  sector_id: string
  name: string
  description?: string
  max_capacity?: number
  is_active: boolean
  created_by: string
  created_at: string
  events?: Event
  list_types?: ListType
  sectors?: Sector
  users?: User
  _count?: {
    guest_lists: number
    checked_in: number
  }
}

export interface GuestList {
  id: string
  event_id?: string
  event_list_id?: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  submitted_by?: string
  sender_name?: string
  sender_email?: string
  status: "pending" | "approved" | "rejected"
  checked_in: boolean
  checked_in_at?: string
  created_at: string
  events?: Event
  event_lists?: EventList
  users?: User
}

export interface ActivityLog {
  id: string
  user_id?: string
  event_id?: string
  action: string
  details?: string
  created_at: string
  users?: User
  events?: Event
}
