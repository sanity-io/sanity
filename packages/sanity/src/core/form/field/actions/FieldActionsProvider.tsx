import {type Path} from '@sanity/types'
import {memo, type PropsWithChildren, useCallback, useMemo, useSyncExternalStore} from 'react'
import {FieldActionsContext, type FieldActionsContextValue} from 'sanity/_singletons'

import {type DocumentFieldActionNode} from '../../../config'
import {pathToString} from '../../../field'
import {supportsTouch} from '../../../util'
import {useHoveredField} from '../useHoveredField'

type FieldActionsProviderProps = PropsWithChildren<{
  actions: DocumentFieldActionNode[]
  focused?: boolean
  path: Path
}>

/** @internal */
export const FieldActionsProvider = memo(function FieldActionsProvider(
  props: FieldActionsProviderProps,
) {
  const {actions, children, path, focused} = props
  const {
    onMouseEnter: onFieldMouseEnter,
    onMouseLeave: onFieldMouseLeave,
    store: hoveredStore,
  } = useHoveredField()
  /**
   * The `useSyncExternalStore` has a super power: if the value returned by the snapshot hasn't changed since last time, React won't re-render the component.
   * This is why we can subscribe to the state of what's currently being hovered, but the component won't re-render unless the hovered state changes between `true` and `false`.
   */
  const hovered = useSyncExternalStore(hoveredStore.subscribe, () => {
    const [hoveredPath] = hoveredStore.getSnapshot()
    return supportsTouch || (hoveredPath ? pathToString(path) === hoveredPath : false)
  })

  const handleMouseEnter = useCallback(() => {
    onFieldMouseEnter(path)
  }, [onFieldMouseEnter, path])

  const handleMouseLeave = useCallback(() => {
    onFieldMouseLeave(path)
  }, [onFieldMouseLeave, path])

  const context: FieldActionsContextValue = useMemo(
    () => ({
      actions,
      focused,
      hovered,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [actions, focused, handleMouseEnter, handleMouseLeave, hovered],
  )

  return <FieldActionsContext.Provider value={context}>{children}</FieldActionsContext.Provider>
})
FieldActionsProvider.displayName = 'Memo(FieldActionsProvider)'
