import {type Path} from '@sanity/types'
import {type ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {RevealedPathsContext, type RevealedPathsContextValue} from 'sanity/_singletons'

import {pathToString} from '../../../field/paths/helpers'

interface RevealedPathsProviderProps {
  children: ReactNode
  /** Document ID - when this changes, revealed paths are automatically cleared */
  documentId?: string
}

export function RevealedPathsProvider({
  children,
  documentId,
}: RevealedPathsProviderProps): ReactNode {
  const [revealedPaths, setRevealedPaths] = useState<Set<string>>(new Set())

  // Clear revealed paths when document changes
  useEffect(() => {
    setRevealedPaths(new Set())
  }, [documentId])

  const revealPath = useCallback((path: Path) => {
    setRevealedPaths((prev) => {
      // Check if path is already revealed to avoid unnecessary state updates
      const pathStr = pathToString(path)
      if (prev.has(pathStr)) {
        return prev // No change needed
      }

      const next = new Set(prev)

      // Add the path itself and all ancestor paths
      // e.g., for path ['parent', 'child', 'field'], add:
      // - 'parent'
      // - 'parent.child'
      // - 'parent.child.field'
      for (let i = 1; i <= path.length; i++) {
        const ancestorPath = path.slice(0, i)
        next.add(pathToString(ancestorPath))
      }

      return next
    })
  }, [])

  const isPathRevealed = useCallback(
    (path: Path): boolean => {
      const pathStr = pathToString(path)

      // Check if this exact path is revealed
      if (revealedPaths.has(pathStr)) {
        return true
      }

      // Check if any ancestor is revealed (shouldn't happen with current logic, but defensive)
      for (let i = 1; i < path.length; i++) {
        const ancestorPath = path.slice(0, i)
        if (revealedPaths.has(pathToString(ancestorPath))) {
          return true
        }
      }

      return false
    },
    [revealedPaths],
  )

  const clearRevealedPaths = useCallback(() => {
    setRevealedPaths(new Set())
  }, [])

  const value: RevealedPathsContextValue = useMemo(
    () => ({revealedPaths, revealPath, isPathRevealed, clearRevealedPaths}),
    [revealedPaths, revealPath, isPathRevealed, clearRevealedPaths],
  )

  return <RevealedPathsContext.Provider value={value}>{children}</RevealedPathsContext.Provider>
}

/**
 * Hook to access revealed paths context.
 * @throws if used outside of RevealedPathsProvider
 */
export function useRevealedPaths(): RevealedPathsContextValue {
  const context = useContext(RevealedPathsContext)
  if (!context) {
    throw new Error('useRevealedPaths must be used within a RevealedPathsProvider')
  }
  return context
}
