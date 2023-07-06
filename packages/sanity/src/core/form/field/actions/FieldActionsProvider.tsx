import React, {PropsWithChildren, useCallback, useMemo} from 'react'
import {Path} from '@sanity/types'
import {DocumentFieldActionNode} from '../../../config'
import {pathToString} from '../../../field'
import {supportsTouch} from '../../../util'
import {useHoveredField} from '../useHoveredField'
import {FieldActionsContext, FieldActionsContextValue} from './FieldActionsContext'

/** @internal */
export function FieldActionsProvider(
  props: PropsWithChildren<{
    actions: DocumentFieldActionNode[]
    path: Path
  }>
) {
  const {actions, children, path} = props
  const {onMouseEnter: onFieldMouseEnter, onMouseLeave: onFieldMouseLeave} = useHoveredField()

  const hoveredPath = useHoveredField().hoveredStack[0]
  const hovered = supportsTouch || (hoveredPath ? pathToString(path) === hoveredPath : false)

  const handleMouseEnter = useCallback(() => {
    onFieldMouseEnter(path)
  }, [onFieldMouseEnter, path])

  const handleMouseLeave = useCallback(() => {
    onFieldMouseLeave(path)
  }, [onFieldMouseLeave, path])

  const context: FieldActionsContextValue = useMemo(
    () => ({
      actions,
      hovered,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [actions, handleMouseEnter, handleMouseLeave, hovered]
  )

  return <FieldActionsContext.Provider value={context}>{children}</FieldActionsContext.Provider>
}
