import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar nomes próprios
export function formatName(name: string): string {
  if (!name || typeof name !== "string") return name

  // Lista de preposições e artigos que devem ficar em minúsculo
  const lowercaseWords = ["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o", "as", "os"]

  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Primeira palavra sempre maiúscula
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      // Preposições e artigos em minúsculo (exceto se for a primeira palavra)
      if (lowercaseWords.includes(word)) {
        return word
      }

      // Outras palavras com primeira letra maiúscula
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

// Função para agrupar listas por remetente e evento
export function groupGuestLists(guestLists: any[]) {
  const groups = new Map()

  guestLists.forEach((guest) => {
    // Criar chave única para o grupo (remetente + evento)
    const senderKey = guest.submitted_by ? `user_${guest.submitted_by}` : `public_${guest.sender_email}`

    const groupKey = `${senderKey}_${guest.event_id}`

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: groupKey,
        event_id: guest.event_id,
        event_name: guest.events?.name,
        event_date: guest.events?.date,
        sender_name: guest.submitted_by ? guest.users?.name : guest.sender_name,
        sender_email: guest.submitted_by ? guest.users?.email : guest.sender_email,
        sender_type: guest.submitted_by ? "user" : "public",
        submitted_by: guest.submitted_by,
        created_at: guest.created_at,
        guests: [],
      })
    }

    groups.get(groupKey).guests.push({
      ...guest,
      guest_name: formatName(guest.guest_name),
    })
  })

  // Converter para array e ordenar os grupos
  const groupsArray = Array.from(groups.values())

  // Ordenar grupos por data de criação (mais recente primeiro)
  groupsArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Ordenar convidados dentro de cada grupo alfabeticamente
  groupsArray.forEach((group) => {
    group.guests.sort((a, b) => a.guest_name.localeCompare(b.guest_name, "pt-BR"))
  })

  return groupsArray
}
