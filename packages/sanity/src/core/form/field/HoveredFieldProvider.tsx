import {Path} from '@sanity/types'
import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react'
import {pathToString} from '../../field'
import {HoveredFieldContext, HoveredFieldContextValue} from './HoveredFieldContext'

/** @internal */
export function HoveredFieldProvider(props: PropsWithChildren) {
  const {children} = props
  const [hoveredStack, setHoveredStack] = useState<string[]>([])

  const handleMouseEnter = useCallback((path: Path) => {
    const pathString = pathToString(path)

    setHoveredStack((prev) => {
      if (prev.includes(pathString)) {
        return prev
      }

      return [pathString, ...prev]
    })
  }, [])

  const handleMouseLeave = useCallback((path: Path) => {
    const pathString = pathToString(path)

    setHoveredStack((prev) => {
      if (prev.includes(pathString)) {
        return prev.filter((item) => item !== pathString)
      }

      return prev
    })
  }, [])

  const context: HoveredFieldContextValue = useMemo(
    () => ({
      hoveredStack,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [handleMouseEnter, handleMouseLeave, hoveredStack],
  )

  return <HoveredFieldContext.Provider value={context}>{children}</HoveredFieldContext.Provider>
}
