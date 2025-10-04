import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia?.(QUERY).matches ?? false : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia(QUERY)
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches)
    mediaQuery.addEventListener('change', handler)
    setReduced(mediaQuery.matches)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reduced
}

