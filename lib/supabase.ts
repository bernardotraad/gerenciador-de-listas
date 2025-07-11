import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  )
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export createClient for compatibility
export { createClient }

/**
 * Cliente singleton para uso em componentes/client side.
 * É criado sob demanda na primeira chamada, depois reutilizado.
 */
let cached: typeof supabase | null = null
export function getSupabase() {
  if (!cached) cached = supabase
  return cached
}

/**
 * Versão com service role – use apenas em Server Components ou Route Handlers.
 */
export function getSupabaseAdmin() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    throw new Error("getSupabaseAdmin deve ser chamado apenas no servidor em produção")
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY (ou URL) não definido")
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type { User }

/* ---- Tipos específicos do projeto ---- */

export interface Event {
  id: string
  name: string
  description?: string
  date: string
  time?: string
  location?: string
  max_capacity: number
  status: "active" | "inactive" | "finished"
  created_by: string
  created_at: string
  users?: User
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
  capacity?: number
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
  guest_lists?: GuestList[]
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

export interface PublicSubmission {
  id: string
  event_id?: string
  event_list_id?: string
  names: string[]
  submitter_name: string
  submitter_phone?: string
  submitter_email?: string
  submission_type: "public" | "specific_list"
  status: "pending" | "approved" | "rejected"
  created_at: string
  processed_at?: string
  processed_by?: string
  events?: Event
  event_lists?: EventList
}

// Interface para usuário customizado
export interface CustomUser {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "portaria"
  created_at: string
}

export default supabase
