import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "portaria"
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  date: string
  location: string
  description?: string
  status: "active" | "inactive" | "completed"
  created_by: string
  created_at: string
  updated_at: string
}

export interface GuestList {
  id: string
  event_id: string
  name: string
  type_id: string
  sector_id: string
  guests: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface ListType {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export interface Sector {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  event_id: string
  guest_name: string
  list_id: string
  checked_in_at: string
  checked_in_by: string
  notes?: string
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  description?: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string
  ip_address?: string
  user_agent?: string
  created_at: string
}
