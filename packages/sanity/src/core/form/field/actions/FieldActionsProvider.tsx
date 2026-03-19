import {type Path} from '@sanity/types'
import {
  memo,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react'
import {FieldActionsContext, type FieldActionsContextValue} from 'sanity/_singletons'

import type {DocumentFieldActionNode} from '../../../config/document/fieldActions/types'
import {pathToString} from '../../../field/paths/helpers'
import {supportsTouch} from '../../../util/supportsTouch'
import {type FieldCommentsProps} from '../../types/fieldProps'
import {useHoveredField} from '../useHoveredField'

type FieldActionsProviderProps = PropsWithChildren<{
  actions: DocumentFieldActionNode[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  __internal_slot?: ReactNode
  focused?: boolean
  path: Path
}>

/** @internal */
export const FieldActionsProvider = memo(function FieldActionsProvider(
  props: FieldActionsProviderProps,
) {
  // by passing the comments and slot here, we can wrap this functionality around any custom field without needing to confirm the title and description
  // eslint-disable-next-line camelcase
  const {actions, children, path, focused, __internal_comments, __internal_slot} = props
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
      // eslint-disable-next-line camelcase
      __internal_comments,
      // eslint-disable-next-line camelcase
      __internal_slot,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [
      actions,
      focused,
      handleMouseEnter,
      handleMouseLeave,
      hovered,
      // eslint-disable-next-line camelcase
      __internal_slot,
      // eslint-disable-next-line camelcase
      __internal_comments,
    ],
  )

  return <FieldActionsContext.Provider value={context}>{children}</FieldActionsContext.Provider>
})
FieldActionsProvider.displayName = 'Memo(FieldActionsProvider)'
