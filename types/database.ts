export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          date: string
          location: string
          description: string | null
          status: "draft" | "active" | "completed" | "cancelled"
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          location: string
          description?: string | null
          status?: "draft" | "active" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          location?: string
          description?: string | null
          status?: "draft" | "active" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      guest_lists: {
        Row: {
          id: string
          event_id: string
          name: string
          type: string
          guests: Json
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          type: string
          guests: Json
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          type?: string
          guests?: Json
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: "admin" | "user" | "portaria"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: "admin" | "user" | "portaria"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: "admin" | "user" | "portaria"
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
