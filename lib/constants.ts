// Constantes centralizadas para melhor manutenção
export const APP_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
  },
  VALIDATION: {
    MIN_SITE_NAME_LENGTH: 2,
    MAX_SITE_NAME_LENGTH: 50,
    MIN_EVENT_NAME_LENGTH: 3,
    MAX_EVENT_NAME_LENGTH: 100,
    MAX_GUEST_NAME_LENGTH: 100,
  },
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 4000,
} as const

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  PORTARIA: "portaria",
} as const

export const ROLE_LABELS = {
  admin: "Administrador",
  user: "Usuário",
  portaria: "Portaria",
} as const

export const ROLE_DESCRIPTIONS = {
  admin: "Acesso completo ao sistema",
  user: "Pode enviar listas de nomes",
  portaria: "Pode enviar nomes e fazer check-in",
} as const

export const EVENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  FINISHED: "finished",
} as const

export const GUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const
