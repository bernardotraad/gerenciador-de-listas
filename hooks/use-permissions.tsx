"use client"

import { useAuth } from "@/lib/auth"
import { useMemo } from "react"

export function usePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user) {
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
      }
    }

    const isAdmin = user.role === "admin"
    const isPortaria = user.role === "portaria"
    const isUser = user.role === "user"

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
    }
  }, [user])

  return permissions
}
