import {type Path} from '@sanity/types'
import {memo, type PropsWithChildren, useCallback, useMemo, useRef, useState} from 'react'
import {HoveredFieldContext, type HoveredFieldContextValue} from 'sanity/_singletons'

import {pathToString} from '../../field'

/** @internal */
export const HoveredFieldProvider = memo(function HoveredFieldProvider(props: PropsWithChildren) {
  const {children} = props
  const [listeners] = useState(() => new Set<() => void>())
  const hoveredStackRef = useRef<string[]>([])

  const handleMouseEnter = useCallback(
    (path: Path) => {
      const pathString = pathToString(path)

      if (!hoveredStackRef.current.includes(pathString)) {
        hoveredStackRef.current = [pathString, ...hoveredStackRef.current]
        for (const listener of listeners) {
          listener()
        }
      }
    },
    [listeners],
  )

  const handleMouseLeave = useCallback(
    (path: Path) => {
      const pathString = pathToString(path)

      if (hoveredStackRef.current.includes(pathString)) {
        hoveredStackRef.current = hoveredStackRef.current.filter((item) => item !== pathString)
        for (const listener of listeners) {
          listener()
        }
      }
    },
    [listeners],
  )

  const store = useMemo(
    () => ({
      subscribe: (onStoreChange: () => void) => {
        listeners.add(onStoreChange)
        return () => {
          listeners.delete(onStoreChange)
        }
      },
      getSnapshot: () => hoveredStackRef.current,
    }),
    [listeners],
  )

  const context: HoveredFieldContextValue = useMemo(
    () => ({
      store,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [handleMouseEnter, handleMouseLeave, store],
  )

  return <HoveredFieldContext.Provider value={context}>{children}</HoveredFieldContext.Provider>
})
