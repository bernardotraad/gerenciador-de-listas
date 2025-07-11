import { APP_CONFIG } from "./constants"

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateSiteName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: "Nome é obrigatório" }
  }

  if (name.length < APP_CONFIG.VALIDATION.MIN_SITE_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Nome deve ter pelo menos ${APP_CONFIG.VALIDATION.MIN_SITE_NAME_LENGTH} caracteres`,
    }
  }

  if (name.length > APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH) {
    return { isValid: false, error: `Nome deve ter no máximo ${APP_CONFIG.VALIDATION.MAX_SITE_NAME_LENGTH} caracteres` }
  }

  return { isValid: true }
}

export const validateEventName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: "Nome do evento é obrigatório" }
  }

  if (name.length < APP_CONFIG.VALIDATION.MIN_EVENT_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Nome deve ter pelo menos ${APP_CONFIG.VALIDATION.MIN_EVENT_NAME_LENGTH} caracteres`,
    }
  }

  if (name.length > APP_CONFIG.VALIDATION.MAX_EVENT_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Nome deve ter no máximo ${APP_CONFIG.VALIDATION.MAX_EVENT_NAME_LENGTH} caracteres`,
    }
  }

  return { isValid: true }
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}

export const validateGuestNames = (names: string): { isValid: boolean; error?: string; count: number } => {
  const namesList = names
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  if (namesList.length === 0) {
    return { isValid: false, error: "Adicione pelo menos um nome", count: 0 }
  }

  // Verificar se algum nome é muito longo
  const longNames = namesList.filter((name) => name.length > APP_CONFIG.VALIDATION.MAX_GUEST_NAME_LENGTH)
  if (longNames.length > 0) {
    return {
      isValid: false,
      error: `Alguns nomes são muito longos (máximo ${APP_CONFIG.VALIDATION.MAX_GUEST_NAME_LENGTH} caracteres)`,
      count: namesList.length,
    }
  }

  return { isValid: true, count: namesList.length }
}
