"use client"

import { useState, useMemo } from "react"
import { APP_CONFIG } from "@/lib/constants"

interface UsePaginationProps<T> {
  data: T[]
  pageSize?: number
}

export function usePagination<T>({ data, pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const previousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  const resetPage = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    totalItems: data.length,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, data.length),
  }
}
