"use client"

import { useState, useEffect } from "react"

const DEFAULT_DELAY = 500

const useDebounce = <T>(value: T, delay: number = DEFAULT_DELAY): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutHandler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutHandler)
    }
  }, [value, delay])

  return debouncedValue
}

export { useDebounce }
