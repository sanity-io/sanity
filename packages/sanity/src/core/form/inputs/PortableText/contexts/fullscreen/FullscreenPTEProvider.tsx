import {type Path} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'

import {pathToString} from '../../../../../validation/util/pathToString'
import {FullscreenPTEContext, type FullscreenPTEContextValue} from './FullscreenPTEContext'

interface FullscreenPTEProviderProps {
  children: React.ReactNode
}

/**
 * Provider that tracks fullscreen state for portable text editors by their path
 * @internal
 */
export function FullscreenPTEProvider({children}: FullscreenPTEProviderProps): React.JSX.Element {
  const [fullscreenPaths, setFullscreenPaths] = useState<string[]>([])

  const getFullscreenPath = useCallback(
    (path: Path): string | undefined => {
      return fullscreenPaths.find((savedPath) => savedPath === pathToString(path)) ?? undefined
    },
    [fullscreenPaths],
  )

  const setFullscreenPath = useCallback(
    (path: Path, isFullscreen: boolean): void => {
      if (isFullscreen) {
        setFullscreenPaths([...fullscreenPaths, pathToString(path)])
      } else {
        setFullscreenPaths(fullscreenPaths.filter((savedPath) => savedPath !== pathToString(path)))
      }
    },
    [fullscreenPaths],
  )

  const hasAnyFullscreen = useCallback((): boolean => {
    return fullscreenPaths.length > 0
  }, [fullscreenPaths])

  const contextValue = useMemo(
    (): FullscreenPTEContextValue => ({
      getFullscreenPath,
      setFullscreenPath,
      hasAnyFullscreen,
      allFullscreenPaths: fullscreenPaths,
    }),
    [getFullscreenPath, setFullscreenPath, hasAnyFullscreen, fullscreenPaths],
  )

  return (
    <FullscreenPTEContext.Provider value={contextValue}>{children}</FullscreenPTEContext.Provider>
  )
}
