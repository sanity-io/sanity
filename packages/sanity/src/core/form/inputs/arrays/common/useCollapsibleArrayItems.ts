import {type ArraySchemaType, isKeySegment, type Path} from '@sanity/types'
import {useCallback, useContext, useMemo, useState} from 'react'
import {SourceContext} from 'sanity/_singletons'

import {initialCollapseArrayItems} from '../../../../config/configPropertyReducers'

/** Stands in for the limit when collapsing is switched off, so nothing is ever hidden. */
const NO_LIMIT = Number.POSITIVE_INFINITY

/**
 * The shape the hook needs from an array member. `key` is not read, but constraining on a
 * property every member kind has keeps generic inference working — a constraint of only optional
 * properties is a weak type, which error members (they have no `open`) fail to satisfy.
 *
 * @internal
 */
export interface CollapsibleMember {
  key: string
  /** Whether the item is currently open for editing. Only array of objects members can be open. */
  open?: boolean
}

/** @internal */
export interface CollapsibleArrayItems<TMember> {
  /** Whether the array is long enough for collapsing to be worthwhile. */
  collapsible: boolean
  expanded: boolean
  onToggle: () => void
  visibleMembers: TMember[]
}

/** A field's own schema option wins over the studio-wide configuration. */
function useItemLimit(schemaType: ArraySchemaType, layout: 'list' | 'grid'): number {
  const source = useContext(SourceContext)
  const collapseItems = source?.form?.arrays?.collapseItems ?? initialCollapseArrayItems
  const fieldLimit = schemaType.options?.collapseItemsAfter

  // A per-field limit is taken literally, including for grids.
  if (typeof fieldLimit === 'number') return fieldLimit > 0 ? fieldLimit : NO_LIMIT
  if (fieldLimit === false || !collapseItems.enabled) return NO_LIMIT

  return layout === 'grid' ? collapseItems.gridLimit : collapseItems.limit
}

/**
 * Limits how many array members are rendered, so that a single long array doesn't push the rest
 * of the document form out of view. Members are always truncated from the tail, which keeps
 * rendered indices aligned with the indices the drag-and-drop and patch layers work with.
 *
 * @internal
 */
export function useCollapsibleArrayItems<TMember extends CollapsibleMember>(options: {
  members: TMember[]
  schemaType: ArraySchemaType
  layout: 'list' | 'grid'
  /**
   * Position of the member the focus path points at. Arrays of objects address items by `_key`
   * and arrays of primitives by index, so callers resolve this themselves. A negative or
   * undefined value means the focus is not inside any item.
   */
  focusedIndex?: number
}): CollapsibleArrayItems<TMember> {
  const {members, schemaType, layout, focusedIndex} = options

  const limit = useItemLimit(schemaType, layout)
  const collapsible = members.length > limit

  // Hidden members that are focused or open must be rendered regardless of the collapsed state:
  // focus can be moved into them from outside the array (a validation marker, appending an item),
  // and an open member hosts its own edit dialog.
  const forced = useMemo(() => {
    if (!collapsible) return false
    if (focusedIndex !== undefined && focusedIndex >= limit) return true
    return members.slice(limit).some((member) => member.open === true)
  }, [collapsible, focusedIndex, limit, members])

  const [expanded, setExpanded] = useState(false)
  const [previouslyForced, setPreviouslyForced] = useState(false)

  // Latch expansion so the list doesn't collapse underneath the user once something has taken
  // them into a hidden member. Adjusting state during render rather than in an effect avoids
  // rendering the collapsed list for a frame first.
  if (forced !== previouslyForced) {
    setPreviouslyForced(forced)
    if (forced) setExpanded(true)
  }

  const onToggle = useCallback(() => setExpanded((current) => !current), [])

  const isExpanded = expanded || forced

  const visibleMembers = useMemo(
    () => (collapsible && !isExpanded ? members.slice(0, limit) : members),
    [collapsible, isExpanded, limit, members],
  )

  return {collapsible, expanded: isExpanded, onToggle, visibleMembers}
}

/**
 * Resolves the `_key` of the array member the focus path points at, if any. Only arrays of
 * objects address their items by key.
 *
 * @internal
 */
export function getFocusedMemberKey(focusPath: Path): string | undefined {
  const segment = focusPath[0]
  return isKeySegment(segment) ? segment._key : undefined
}

/**
 * Position of the key-addressed member the focus path points at, or `-1` when the focus is not
 * inside an item. For arrays of objects.
 *
 * @internal
 */
export function useFocusedMemberIndex(members: CollapsibleMember[], focusPath: Path): number {
  const focusedKey = getFocusedMemberKey(focusPath)

  return useMemo(
    () =>
      focusedKey === undefined ? -1 : members.findIndex((member) => member.key === focusedKey),
    [focusedKey, members],
  )
}

/**
 * Position of the item the focus path points at, if any. Arrays of primitives address their items
 * by index rather than by key.
 *
 * @internal
 */
export function getFocusedItemIndex(focusPath: Path): number | undefined {
  const segment = focusPath[0]
  return typeof segment === 'number' ? segment : undefined
}
