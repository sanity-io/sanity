import {type ArraySchemaType, isKeySegment, type Path} from '@sanity/types'
import {useCallback, useContext, useMemo, useState} from 'react'
import {SourceContext} from 'sanity/_singletons'

import {initialCollapseArrayItems} from '../../../../config/configPropertyReducers'

/**
 * Grid layouts fit several items per row, so the configured limit, which reads as a number of
 * list rows, would otherwise collapse a grid after a single row.
 */
const GRID_LIMIT_MULTIPLIER = 2

/**
 * Collapsing is skipped unless it hides at least this many items, since hiding one or two rows
 * costs about as much vertical space as the toggle that replaces them.
 */
const MIN_HIDDEN_ITEMS = 3

interface CollapsibleMember {
  key: string
  /** Array of objects members expose whether the item is currently open for editing. */
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

/**
 * Reads the item limit for an array field, preferring the field's own schema option over the
 * studio-wide configuration.
 */
function useItemLimit(schemaType: ArraySchemaType, layout: 'list' | 'grid'): number | null {
  const source = useContext(SourceContext)
  const collapseItems = source?.form?.arrays?.collapseItems ?? initialCollapseArrayItems
  const fieldLimit = schemaType.options?.collapseItemsAfter

  // An explicit per-field limit is taken literally, including for grids.
  if (typeof fieldLimit === 'number') return fieldLimit > 0 ? fieldLimit : null
  if (fieldLimit === false || !collapseItems.enabled) return null

  return layout === 'grid' ? collapseItems.limit * GRID_LIMIT_MULTIPLIER : collapseItems.limit
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
  focusedKey?: string | number
}): CollapsibleArrayItems<TMember> {
  const {members, schemaType, layout, focusedKey} = options

  const limit = useItemLimit(schemaType, layout)
  const hiddenCount = limit === null ? 0 : Math.max(members.length - limit, 0)
  const collapsible = hiddenCount >= MIN_HIDDEN_ITEMS

  // Hidden members that are focused or open must be rendered regardless of the collapsed state:
  // focus can be moved into them from outside the array (a validation marker, a deep link), and
  // an open member hosts its own edit dialog.
  const forced = useMemo(() => {
    if (!collapsible || limit === null) return false
    return members.slice(limit).some((member) => member.open === true || member.key === focusedKey)
  }, [collapsible, focusedKey, limit, members])

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
    () => (collapsible && !isExpanded && limit !== null ? members.slice(0, limit) : members),
    [collapsible, isExpanded, limit, members],
  )

  return {collapsible, expanded: isExpanded, onToggle, visibleMembers}
}

/**
 * Resolves the key of the array member the focus path points at, if any.
 *
 * @internal
 */
export function getFocusedMemberKey(focusPath: Path): string | number | undefined {
  const segment = focusPath[0]
  if (isKeySegment(segment)) return segment._key
  if (typeof segment === 'number') return segment
  return undefined
}
