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
  /** Set of path strings that are naturally hidden (by schema, ignoring reveals) */
  naturallyHiddenPaths: Set<string>
  /** Update the set of naturally hidden paths (called from useFormState) */
  setNaturallyHiddenPaths: (paths: Set<string>) => void
  /** Reveal a path and all its ancestors */
  revealPath: (path: Path) => void
  /** Check if a path (or any of its ancestors) is revealed */
  isPathRevealed: (path: Path) => boolean
  /** Check if this path is the root of a reveal tree (directly revealed, not via ancestor) */
  isRevealRoot: (path: Path) => boolean
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
