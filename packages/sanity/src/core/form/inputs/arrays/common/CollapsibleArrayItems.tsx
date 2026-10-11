import {type ArraySchemaType} from '@sanity/types'
import {type ReactNode} from 'react'

import {
  type CollapsibleArrayItems as CollapsibleArrayItemsState,
  type CollapsibleMember,
  useCollapsibleArrayItems,
} from './useCollapsibleArrayItems'

interface CollapsibleArrayItemsProps<TMember> {
  members: TMember[]
  schemaType: ArraySchemaType
  layout: 'list' | 'grid'
  focusedIndex?: number
  children: (state: CollapsibleArrayItemsState<TMember>) => ReactNode
}

/**
 * Render prop wrapper around {@link useCollapsibleArrayItems}, for inputs that cannot call hooks
 * themselves. `ArrayOfPrimitivesInput` is a class component because it needs
 * `getSnapshotBeforeUpdate`, and it is part of the public API, so it cannot be converted.
 *
 * @internal
 */
export function CollapsibleArrayItems<TMember extends CollapsibleMember>(
  props: CollapsibleArrayItemsProps<TMember>,
) {
  const {children, ...options} = props
  return children(useCollapsibleArrayItems(options))
}
