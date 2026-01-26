import {type Path} from '@sanity/types'

/**
 * Context for tracking fullscreen state of portable text editors by their path
 * @internal
 */
export interface FullscreenPTEContextValue {
  /**
   * Get the fullscreen state for a specific path
   */
  getFullscreenPath: (path: Path) => string | undefined
  /**
   * Set the fullscreen state for a specific path
   */
  setFullscreenPath: (path: Path, isFullscreen: boolean) => void
  /**
   * Check if any portable text editor is currently in fullscreen mode
   */
  hasAnyFullscreen: () => boolean
  /**
   * Get all fullscreen paths
   */
  allFullscreenPaths: string[]
}
