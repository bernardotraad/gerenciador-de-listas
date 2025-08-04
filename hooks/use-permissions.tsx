"use client"

import { useAuth } from "@/lib/auth"
import { useMemo } from "react"

interface UserPermissions {
  canViewEvents: boolean
  canManageEvents: boolean
  canViewLists: boolean
  canManageLists: boolean
  canCheckIn: boolean
  canManageUsers: boolean
  canViewLogs: boolean
  canManageSettings: boolean
  canCreateEvents: boolean
  canDeleteEvents: boolean
  canEditEvents: boolean
  canViewReports: boolean
  canExportData: boolean
  canManageListTypes: boolean
  canManageSectors: boolean
  canSubmitGuests: boolean
  isAdmin: boolean
  isPortaria: boolean
  isUser: boolean
}

const getDefaultPermissions = (): UserPermissions => ({
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
})

const getAdminPermissions = (): UserPermissions => ({
  canViewEvents: true,
  canManageEvents: true,
  canViewLists: true,
  canManageLists: true,
  canCheckIn: true,
  canManageUsers: true,
  canViewLogs: true,
  canManageSettings: true,
  canCreateEvents: true,
  canDeleteEvents: true,
  canEditEvents: true,
  canViewReports: true,
  canExportData: true,
  canManageListTypes: true,
  canManageSectors: true,
  canSubmitGuests: true,
  isAdmin: true,
  isPortaria: false,
  isUser: false,
})

const getPortariaPermissions = (): UserPermissions => ({
  canViewEvents: true,
  canManageEvents: false,
  canViewLists: true,
  canManageLists: true,
  canCheckIn: true,
  canManageUsers: false,
  canViewLogs: false,
  canManageSettings: false,
  canCreateEvents: false,
  canDeleteEvents: false,
  canEditEvents: false,
  canViewReports: true,
  canExportData: true,
  canManageListTypes: false,
  canManageSectors: false,
  canSubmitGuests: true,
  isAdmin: false,
  isPortaria: true,
  isUser: false,
})

const getUserPermissions = (): UserPermissions => ({
  canViewEvents: true,
  canManageEvents: false,
  canViewLists: true,
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
  canSubmitGuests: true,
  isAdmin: false,
  isPortaria: false,
  isUser: true,
})

const usePermissions = (): UserPermissions => {
  const { customUser } = useAuth()

  const permissions = useMemo(() => {
    if (!customUser) {
      return getDefaultPermissions()
    }

    const { role } = customUser

    switch (role) {
      case "admin":
        return getAdminPermissions()
      case "portaria":
        return getPortariaPermissions()
      case "user":
        return getUserPermissions()
      default:
        return getDefaultPermissions()
    }
  }, [customUser])

  return permissions
}

export { usePermissions }
export type { UserPermissions }
