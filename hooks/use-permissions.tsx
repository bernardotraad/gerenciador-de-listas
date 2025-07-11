"use client"

import { useAuth } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"

export function usePermissions() {
  const { user } = useAuth()

  const isAdmin = user?.role === USER_ROLES.ADMIN
  const isUser = user?.role === USER_ROLES.USER
  const isPortaria = user?.role === USER_ROLES.PORTARIA

  const canManageEvents = isAdmin
  const canManageUsers = isAdmin
  const canViewLogs = isAdmin
  const canAccessSettings = isAdmin
  const canSendNames = isAdmin || isUser || isPortaria
  const canCheckIn = isAdmin || isPortaria
  const canViewDashboard = isAdmin || isUser || isPortaria
  const canViewEvents = isAdmin || isUser || isPortaria
  const canViewGuestLists = isAdmin || isUser || isPortaria

  const hasFullAccess = isAdmin
  const hasLimitedAccess = isPortaria
  const hasBasicAccess = isUser

  return {
    user,
    isAdmin,
    isUser,
    isPortaria,
    canManageEvents,
    canManageUsers,
    canViewLogs,
    canAccessSettings,
    canSendNames,
    canCheckIn,
    canViewDashboard,
    canViewEvents,
    canViewGuestLists,
    hasFullAccess,
    hasLimitedAccess,
    hasBasicAccess,
  }
}
