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

  const hideRevealedPath = useCallback((path: Path) => {
    setRevealedPaths((prev) => {
      const pathStr = pathToString(path)
      if (!prev.has(pathStr)) {
        return prev // Path not revealed, no change needed
      }

      const next = new Set(prev)

      // Remove the path itself and all descendants
      // A descendant path starts with the same prefix
      for (const existingPath of prev) {
        if (existingPath === pathStr || existingPath.startsWith(pathStr + '.')) {
          next.delete(existingPath)
        }
      }

      return next
    })
  }, [])

  const value: RevealedPathsContextValue = useMemo(
    () => ({revealedPaths, revealPath, isPathRevealed, clearRevealedPaths, hideRevealedPath}),
    [revealedPaths, revealPath, isPathRevealed, clearRevealedPaths, hideRevealedPath],
  )

  return <RevealedPathsContext.Provider value={value}>{children}</RevealedPathsContext.Provider>
}

// Default no-op context value for when used outside RevealedPathsProvider
const DEFAULT_REVEALED_PATHS_VALUE: RevealedPathsContextValue = {
  revealedPaths: new Set<string>(),
  revealPath: () => {},
  isPathRevealed: () => false,
  clearRevealedPaths: () => {},
  hideRevealedPath: () => {},
}

/**
 * Hook to access revealed paths context.
 * Returns a safe no-op default when used outside of RevealedPathsProvider,
 * allowing useDocumentForm to work in contexts like TasksFormBuilder and DiffViewPane.
 */
export function useRevealedPaths(): RevealedPathsContextValue {
  const context = useContext(RevealedPathsContext)
  return context ?? DEFAULT_REVEALED_PATHS_VALUE
}
