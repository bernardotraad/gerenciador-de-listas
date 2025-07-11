"use client"

import { useAuth } from "@/lib/auth"
import { useMemo } from "react"

export function usePermissions() {
  const { customUser } = useAuth()

  const permissions = useMemo(() => {
    if (!customUser) {
      return {
        canViewEvents: false,
        canManageEvents: false,
        canViewLists: false,
        canManageLists: false,
        canCheckIn: false,
        canManageUsers: false,
        canViewLogs: false,
        canManageSettings: false,
        canCreateEvents: false,
        canDeleteEvents: false,
        canEditEvents: false,
        canViewReports: false,
        canExportData: false,
        canManageListTypes: false,
        canManageSectors: false,
        canSubmitGuests: false,
        isAdmin: false,
        isPortaria: false,
        isUser: false,
      }
    }

    const isAdmin = customUser.role === "admin"
    const isPortaria = customUser.role === "portaria"
    const isUser = customUser.role === "user"

    return {
      // Visualização de eventos
      canViewEvents: isAdmin || isPortaria || isUser,

      // Gerenciamento de eventos
      canManageEvents: isAdmin,
      canCreateEvents: isAdmin,
      canDeleteEvents: isAdmin,
      canEditEvents: isAdmin,

      // Visualização de listas
      canViewLists: isAdmin || isPortaria || isUser,

      // Gerenciamento de listas
      canManageLists: isAdmin || isPortaria,

      // Check-in
      canCheckIn: isAdmin || isPortaria,

      // Gerenciamento de usuários
      canManageUsers: isAdmin,

      // Visualização de logs
      canViewLogs: isAdmin,

      // Configurações do sistema
      canManageSettings: isAdmin,

      // Relatórios
      canViewReports: isAdmin || isPortaria,

      // Exportação de dados
      canExportData: isAdmin || isPortaria,

      // Gerenciamento de tipos de lista
      canManageListTypes: isAdmin,

      // Gerenciamento de setores
      canManageSectors: isAdmin,

      // Novas permissões
      canSubmitGuests: isAdmin || isPortaria || isUser,
      isAdmin: isAdmin,
      isPortaria: isPortaria,
      isUser: isUser,
    }
  }, [customUser])

  return permissions
}
