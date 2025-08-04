"use client"

import { useState, useMemo } from "react"

interface UsePaginationReturn<T> {
  currentItems: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface UsePaginationOptions {
  pageSize?: number
  initialPage?: number
}

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_INITIAL_PAGE = 1

const usePagination = <T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> => {
  const { 
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE, 
    initialPage = DEFAULT_INITIAL_PAGE 
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const currentItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const handleGoToPage = (page: number) => {
    const isValidPage = page >= 1 && page <= totalPages
    
    if (isValidPage) {
      setCurrentPage(page)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleSetPageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(DEFAULT_INITIAL_PAGE) // Reset to first page when changing page size
  }

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage: handleGoToPage,
    nextPage: handleNextPage,
    previousPage: handlePreviousPage,
    setPageSize: handleSetPageSize,
    hasNextPage,
    hasPreviousPage,
  }
}

export { usePagination }
export type { UsePaginationReturn, UsePaginationOptions }
