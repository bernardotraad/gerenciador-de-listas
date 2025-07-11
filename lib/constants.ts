export const APP_CONFIG = {
  // Configurações de paginação
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Configurações de debounce
  DEBOUNCE_DELAY: 300,

  // Configurações de validação
  VALIDATION: {
    MIN_SITE_NAME_LENGTH: 3,
    MAX_SITE_NAME_LENGTH: 50,
    MIN_EVENT_NAME_LENGTH: 3,
    MAX_EVENT_NAME_LENGTH: 100,
    MAX_GUEST_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 6,
    MAX_DESCRIPTION_LENGTH: 500,
  },

  // Configurações de upload
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  },

  // Configurações de notificação
  TOAST: {
    DURATION: 4000,
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
  },
}

// Labels e descrições dos roles
export const ROLE_LABELS = {
  admin: "Administrador",
  user: "Usuário",
  portaria: "Portaria",
} as const

export const ROLE_DESCRIPTIONS = {
  admin: "Acesso completo ao sistema",
  user: "Pode enviar listas de nomes",
  portaria: "Pode fazer check-in e gerenciar listas",
} as const

// Status dos eventos
export const EVENT_STATUS = {
  active: "Ativo",
  inactive: "Inativo",
  finished: "Finalizado",
} as const

// Status das listas de convidados
export const GUEST_STATUS = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
} as const

// Cores padrão para tipos de lista
export const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
]

// Configurações de tema
export const THEME_CONFIG = {
  DEFAULT_THEME: "system",
  THEMES: ["light", "dark", "system"],
}

// Configurações de localização
export const LOCALE_CONFIG = {
  DEFAULT_LOCALE: "pt-BR",
  TIMEZONE: "America/Sao_Paulo",
  CURRENCY: "BRL",
}

// Mensagens padrão
export const MESSAGES = {
  LOADING: "Carregando...",
  NO_DATA: "Nenhum dado encontrado",
  ERROR_GENERIC: "Ocorreu um erro inesperado",
  SUCCESS_SAVE: "Salvo com sucesso!",
  SUCCESS_DELETE: "Excluído com sucesso!",
  SUCCESS_UPDATE: "Atualizado com sucesso!",
  CONFIRM_DELETE: "Tem certeza que deseja excluir?",
  ACCESS_DENIED: "Acesso negado",
  INVALID_DATA: "Dados inválidos",
  NETWORK_ERROR: "Erro de conexão",
}

// Configurações de API
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
}

// Configurações de cache
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  LONG_TTL: 60 * 60 * 1000, // 1 hora
  SHORT_TTL: 30 * 1000, // 30 segundos
}
