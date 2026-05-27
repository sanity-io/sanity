/* eslint-disable camelcase */
import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {FullscreenPTEContext} from 'sanity/_singletons'

import {pathToString} from '../../../../../validation/util/pathToString'
import {
  EditorClosed,
  EditorOpened,
} from '../../../../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {useEnhancedObjectDialog} from '../../../../studio/tree-editing/context/enabled/useEnhancedObjectDialog'
import {type FullscreenPTEContextValue} from './FullscreenPTEContext'

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
  const {enabled: enhancedObjectDialogEnabled} = useEnhancedObjectDialog()

  const getFullscreenPath = useCallback(
    (path: Path): string | undefined => {
      return fullscreenPaths.find((savedPath) => savedPath === pathToString(path)) ?? undefined
    },
    [fullscreenPaths],
  )

  const setFullscreenPath = useCallback(
    (path: Path, isFullscreen: boolean): void => {
      if (isFullscreen) {
        telemetry.log(EditorOpened, {
          path: pathToString(path),
          origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
          editor_type: 'pte',
          fullscreen: true,
          location: 'nested_object_dialog',
        })
        setFullscreenPaths([...fullscreenPaths, pathToString(path)])
      } else {
        telemetry.log(EditorClosed, {
          path: pathToString(path),
          origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
          editor_type: 'pte',
          fullscreen: true,
          location: 'nested_object_dialog',
        })
        setFullscreenPaths(fullscreenPaths.filter((savedPath) => savedPath !== pathToString(path)))
      }
    },
    [fullscreenPaths, telemetry, enhancedObjectDialogEnabled],
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
