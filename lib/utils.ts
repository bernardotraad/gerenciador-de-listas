import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GuestList } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar nomes próprios
export function formatName(name: string): string {
  if (!name || typeof name !== "string") return ""

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // Palavras que devem permanecer em minúsculo
      const lowercaseWords = ["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o", "as", "os"]

      if (lowercaseWords.includes(word)) {
        return word
      }

      // Capitalizar primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
    .trim()
}

// Função para agrupar listas de convidados por remetente
export function groupGuestLists(guestLists: GuestList[]) {
  const groups = new Map()

  guestLists.forEach((guest) => {
    // Determinar o remetente
    const senderName = guest.users?.name || guest.sender_name || "Remetente Desconhecido"
    const senderEmail = guest.users?.email || guest.sender_email || "email@desconhecido.com"
    const senderType = guest.users ? "user" : "public"

    // Determinar o evento
    const eventName = guest.events?.name || guest.event_lists?.events?.name || "Evento Desconhecido"
    const eventDate = guest.events?.date || guest.event_lists?.events?.date || guest.created_at
    const eventId = guest.event_id || guest.event_lists?.event_id || "unknown"

    // Criar chave única para o grupo
    const groupKey = `${senderEmail}-${eventId}`

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: groupKey,
        sender_name: senderName,
        sender_email: senderEmail,
        sender_type: senderType,
        event_name: eventName,
        event_date: eventDate,
        event_id: eventId,
        guests: [],
      })
    }

    groups.get(groupKey).guests.push(guest)
  })

  // Converter para array e ordenar
  return Array.from(groups.values()).sort((a, b) => {
    // Primeiro por nome do evento
    const eventCompare = a.event_name.localeCompare(b.event_name)
    if (eventCompare !== 0) return eventCompare

    // Depois por nome do remetente
    return a.sender_name.localeCompare(b.sender_name)
  })
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para formatar telefone brasileiro
export function formatPhone(phone: string): string {
  if (!phone) return ""

  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, "")

  // Formata conforme o tamanho
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  return phone
}

// Função para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Função para formatar data brasileira
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

// Função para formatar data e hora brasileira
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// Função para formatar hora brasileira
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// Função para gerar ID único
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Função para debounce
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Função para capitalizar primeira letra
export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Função para remover acentos
export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Função para gerar slug
export function generateSlug(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// Função para gerar senha
export function generatePassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
