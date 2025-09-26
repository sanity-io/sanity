import {type Path} from '@sanity/types'
import {useCallback, useMemo, useRef} from 'react'

import {FullscreenPTEContext, type FullscreenPTEContextValue} from './FullscreenPTEContext'

interface FullscreenPTEProviderProps {
  children: React.ReactNode
}

/**
 * Provider that tracks fullscreen state for portable text editors by their path
 * @internal
 */
export function FullscreenPTEProvider({children}: FullscreenPTEProviderProps): React.JSX.Element {
  const fullscreenStateRef = useRef<Map<string, boolean>>(new Map())

  const pathToKey = useCallback((path: Path): string => {
    return JSON.stringify(path)
  }, [])

  const getFullscreenState = useCallback(
    (path: Path): boolean => {
      const key = pathToKey(path)
      return fullscreenStateRef.current.get(key) ?? false
    },
    [pathToKey],
  )

  const setFullscreenState = useCallback(
    (path: Path, isFullscreen: boolean): void => {
      const key = pathToKey(path)
      if (isFullscreen) {
        fullscreenStateRef.current.set(key, true)
      } else {
        fullscreenStateRef.current.delete(key)
      }
    },
    [pathToKey],
  )

  const hasAnyFullscreen = useCallback((): boolean => {
    return fullscreenStateRef.current.size > 0
  }, [])

  const contextValue = useMemo(
    (): FullscreenPTEContextValue => ({
      getFullscreenState,
      setFullscreenState,
      hasAnyFullscreen,
    }),
    [getFullscreenState, setFullscreenState, hasAnyFullscreen],
  )

  return (
    <FullscreenPTEContext.Provider value={contextValue}>{children}</FullscreenPTEContext.Provider>
  )
}
