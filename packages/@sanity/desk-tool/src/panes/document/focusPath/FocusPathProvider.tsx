import React, {memo, ReactNode, useCallback, useLayoutEffect, useMemo, useState} from 'react'
import {Path} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import {FocusPathContext} from './FocusPathContext'

const EMPTY_PATH = pathFor([])

export interface FocusPathProviderProps {
  children: ReactNode
  controlledPath?: Path
  onFocus?: (path: Path) => void
}

export const FocusPathProvider = memo(function FocusPathProvider(props: FocusPathProviderProps) {
  const {children, controlledPath, onFocus} = props

  const [focusPath, setFocusPath] = useState<Path>(() =>
    controlledPath ? pathFor(controlledPath) : EMPTY_PATH
  )

  useLayoutEffect(() => {
    if (controlledPath) {
      setFocusPath(pathFor(controlledPath))
    }
  }, [controlledPath])

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      onFocus?.(nextFocusPath)
    },
    [onFocus, setFocusPath]
  )

  const value = useMemo(() => ({focusPath, onFocus: handleFocus}), [focusPath, handleFocus])
  return <FocusPathContext.Provider value={value}>{children}</FocusPathContext.Provider>
})
