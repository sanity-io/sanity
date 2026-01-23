import {type Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * Context value for tracking revealed paths (paths that should ignore hidden property).
 * Used when navigating to validation errors on hidden fields.
 * @internal
 */
export interface RevealedPathsContextValue {
  /** Set of path strings that should be revealed (hidden property ignored) */
  revealedPaths: Set<string>
  /** Reveal a path and all its ancestors */
  revealPath: (path: Path) => void
  /** Check if a path (or any of its ancestors) is revealed */
  isPathRevealed: (path: Path) => boolean
  /** Clear all revealed paths */
  clearRevealedPaths: () => void
  /** Hide a specific revealed path (and its descendants) */
  hideRevealedPath: (path: Path) => void
}

/**
 * Context for temporarily revealing hidden fields when navigating from validation errors.
 * @internal
 */
export const RevealedPathsContext = createContext<RevealedPathsContextValue | null>(
  'sanity/_singletons/context/revealed-paths',
  null,
)
