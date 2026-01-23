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
  // Track which paths are the "root" of a reveal tree - these get the close button
  const [revealRoots, setRevealRoots] = useState<Set<string>>(new Set())

  // Clear revealed paths when document changes
  useEffect(() => {
    setRevealedPaths(new Set())
    setRevealRoots(new Set())
  }, [documentId])

  const revealPath = useCallback((path: Path) => {
    const pathStr = pathToString(path)

    setRevealedPaths((prev) => {
      // Check if path is already revealed to avoid unnecessary state updates
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

    // Mark the first hidden ancestor as the root (where the close button should appear)
    // The actual root will be determined by the caller - we mark the target path as root
    // since it's the one that was directly requested to be revealed
    setRevealRoots((prev) => {
      if (prev.has(pathStr)) {
        return prev
      }
      const next = new Set(prev)
      next.add(pathStr)
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
    setRevealRoots(new Set())
  }, [])

  // Check if this path is a reveal root (where the close button should appear)
  // A reveal root is a path that was directly revealed AND has no revealed ancestor
  const isRevealRoot = useCallback(
    (path: Path): boolean => {
      const pathStr = pathToString(path)

      // Must be in the reveal roots set
      if (!revealRoots.has(pathStr)) {
        return false
      }

      // Check if any ancestor is also revealed - if so, this is not the root
      for (let i = 1; i < path.length; i++) {
        const ancestorPath = path.slice(0, i)
        if (revealedPaths.has(pathToString(ancestorPath))) {
          return false // An ancestor is revealed, so this is not the topmost
        }
      }

      return true
    },
    [revealRoots, revealedPaths],
  )

  const hideRevealedPath = useCallback((path: Path) => {
    const pathStr = pathToString(path)

    setRevealedPaths((prev) => {
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

    // Also remove from reveal roots
    setRevealRoots((prev) => {
      const next = new Set(prev)
      for (const existingPath of prev) {
        if (existingPath === pathStr || existingPath.startsWith(pathStr + '.')) {
          next.delete(existingPath)
        }
      }
      return next
    })
  }, [])

  const value: RevealedPathsContextValue = useMemo(
    () => ({
      revealedPaths,
      revealPath,
      isPathRevealed,
      isRevealRoot,
      clearRevealedPaths,
      hideRevealedPath,
    }),
    [revealedPaths, revealPath, isPathRevealed, isRevealRoot, clearRevealedPaths, hideRevealedPath],
  )

  return <RevealedPathsContext.Provider value={value}>{children}</RevealedPathsContext.Provider>
}

// Default no-op context value for when used outside RevealedPathsProvider
const DEFAULT_REVEALED_PATHS_VALUE: RevealedPathsContextValue = {
  revealedPaths: new Set<string>(),
  revealPath: () => {},
  isPathRevealed: () => false,
  isRevealRoot: () => false,
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
