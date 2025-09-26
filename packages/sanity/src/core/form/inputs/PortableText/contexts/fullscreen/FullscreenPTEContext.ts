import {type Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * Context for tracking fullscreen state of portable text editors by their path
 * @internal
 */
export interface FullscreenPTEContextValue {
  /**
   * Get the fullscreen state for a specific path
   */
  getFullscreenState: (path: Path) => boolean
  /**
   * Set the fullscreen state for a specific path
   */
  setFullscreenState: (path: Path, isFullscreen: boolean) => void
  /**
   * Check if any portable text editor is currently in fullscreen mode
   */
  hasAnyFullscreen: () => boolean
}

export const FullscreenPTEContext = createContext<FullscreenPTEContextValue>(
  'sanity/_singletons/context/fullscreen-pte',
  {
    getFullscreenState: () => false,
    setFullscreenState: () => {},
    hasAnyFullscreen: () => false,
  },
)
