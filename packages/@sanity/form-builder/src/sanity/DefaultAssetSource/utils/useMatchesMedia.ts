import {useState, useCallback, useEffect} from 'react'
import {useTheme} from '@sanity/ui'

export function useMatchesMedia(
  size: 0 | 1 | 2 | 3 | 4 | 5,
  condition: 'min' | 'max' = 'max'
): boolean {
  const {sanity} = useTheme()
  const {media} = sanity

  const mediaWidth = media[size]
  const query = window.matchMedia(`(${condition}-width: ${mediaWidth}px)`)
  const [matches, setMatches] = useState<boolean>(query.matches)

  const handleChange = useCallback((e: MediaQueryListEvent) => {
    setMatches(e.matches)
  }, [])

  useEffect(() => {
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [handleChange, query])

  return matches
}
