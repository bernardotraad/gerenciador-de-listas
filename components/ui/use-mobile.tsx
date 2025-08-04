import * as React from "react"

const MOBILE_BREAKPOINT = 768

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    mql.addEventListener("change", handleChange)
    handleResize()

    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return !!isMobile
}

export { useIsMobile }
