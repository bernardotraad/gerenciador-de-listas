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
  const groups = new Map<string, any>()

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
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))
  } catch {
    return "Data inválida"
  }
}

// Função para formatar data e hora brasileira
export function formatDateTime(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  } catch {
    return "Data inválida"
  }
}

// Função para formatar hora brasileira
export function formatTime(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  } catch {
    return "Hora inválida"
  }
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

// Função para validar CPF
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "")
  
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

// Função para formatar CPF
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, "")
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

// Função para validar CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "")
  
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  let digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  let digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false
  
  return true
}

// Função para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, "")
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}
