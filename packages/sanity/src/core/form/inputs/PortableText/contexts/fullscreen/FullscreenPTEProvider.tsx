import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'

import {pathToString} from '../../../../../validation/util/pathToString'
import {
  ClosedPortableTextEditorFullScreen,
  OpenedPortableTextEditorFullScreen,
} from '../../../../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {useTreeEditingEnabled} from '../../../../studio/tree-editing/context/enabled/useTreeEditingEnabled'
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
  const telemetry = useTelemetry()
  const {enabled} = useTreeEditingEnabled()

  const getFullscreenPath = useCallback(
    (path: Path): string | undefined => {
      telemetry.log(ClosedPortableTextEditorFullScreen, {
        objectPath: pathToString(path),
        timestamp: new Date(),
        origin: enabled ? 'nested-object' : 'default',
      })
      return fullscreenPaths.find((savedPath) => savedPath === pathToString(path)) ?? undefined
    },
    [fullscreenPaths, enabled, telemetry],
  )

  const setFullscreenPath = useCallback(
    (path: Path, isFullscreen: boolean): void => {
      telemetry.log(OpenedPortableTextEditorFullScreen, {
        objectPath: pathToString(path),
        timestamp: new Date(),
        origin: enabled ? 'nested-object' : 'default',
      })
      if (isFullscreen) {
        setFullscreenPaths([...fullscreenPaths, pathToString(path)])
      } else {
        setFullscreenPaths(fullscreenPaths.filter((savedPath) => savedPath !== pathToString(path)))
      }
    },
    [fullscreenPaths, telemetry, enabled],
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
