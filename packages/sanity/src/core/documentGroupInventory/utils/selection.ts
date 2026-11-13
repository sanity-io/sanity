import {type ReleaseDocument} from '@sanity/client'

import {isReleaseScheduledOrScheduling} from '../../releases/util/util'

/**
 * The state of a group checkbox, from the rows it governs. It follows the Releases tool's
 * `DocumentTable` select-all: checked when every selectable row is selected, indeterminate when
 * only some are, and unchecked otherwise. Rows that cannot be selected never count.
 *
 * @internal
 */
export type GroupSelectionState = 'checked' | 'indeterminate' | 'unchecked'

/**
 * @internal
 */
export function getGroupSelectionState(
  selectableIds: readonly string[],
  selectedIds: ReadonlySet<string>,
): GroupSelectionState {
  const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length

  if (selectableIds.length !== 0 && selectedCount === selectableIds.length) return 'checked'
  if (selectedCount !== 0) return 'indeterminate'
  return 'unchecked'
}

/**
 * The ids from `anchorId` to `targetId`, both included, in the order given. Empty when either id
 * is not in the list, so a range never reaches outside the group it was started in.
 *
 * @internal
 */
export function getRangeIds(
  orderedIds: readonly string[],
  anchorId: string,
  targetId: string,
): string[] {
  const anchorIndex = orderedIds.indexOf(anchorId)
  const targetIndex = orderedIds.indexOf(targetId)

  if (anchorIndex === -1 || targetIndex === -1) return []

  return orderedIds.slice(
    Math.min(anchorIndex, targetIndex),
    Math.max(anchorIndex, targetIndex) + 1,
  )
}

/**
 * Why a version cannot be selected for deletion, or `undefined` when it can.
 *
 * This is core's existing rule rather than a new one: a version in a scheduled (or scheduling)
 * release is locked, the same check that makes the form read-only for that release
 * (`isReleaseScheduledOrScheduling`). Content Lake refuses to change or delete such a version until
 * the release is unscheduled.
 *
 * @internal
 */
export type SelectionBlockedReason = 'scheduled-release'

/**
 * The words for each reason a version cannot be selected, as studio locale keys.
 *
 * @internal
 */
export const SELECTION_BLOCKED_REASON_KEYS = {
  'scheduled-release': 'document-group.select.blocked.scheduled-release',
} as const satisfies Record<SelectionBlockedReason, string>

/**
 * @internal
 */
export function getSelectionBlockedReason(
  release: ReleaseDocument | undefined,
): SelectionBlockedReason | undefined {
  return release && isReleaseScheduledOrScheduling(release) ? 'scheduled-release' : undefined
}

/**
 * Everything a set's checkboxes need: which rows can be selected, why the others cannot, and the
 * group checkbox's state over the selectable rows.
 *
 * @internal
 */
export interface SetSelection {
  selectableIds: string[]
  blockedReasons: ReadonlyMap<string, SelectionBlockedReason>
  /** Why the group checkbox is blocked: set when no row can be selected, from the first row. */
  groupBlockedReason: SelectionBlockedReason | undefined
  state: GroupSelectionState
}

/**
 * @internal
 */
export function getSetSelection<V extends {id: string}>({
  variants,
  selectedIds,
  getRelease,
}: {
  /** The set's rows as shown, in order. */
  variants: readonly V[]
  selectedIds: ReadonlySet<string>
  getRelease: (variant: V) => ReleaseDocument | undefined
}): SetSelection {
  const blockedReasons = new Map<string, SelectionBlockedReason>()
  for (const variant of variants) {
    const reason = getSelectionBlockedReason(getRelease(variant))
    if (reason) blockedReasons.set(variant.id, reason)
  }

  const selectableIds = variants.map(({id}) => id).filter((id) => !blockedReasons.has(id))

  return {
    selectableIds,
    blockedReasons,
    groupBlockedReason:
      variants.length !== 0 && selectableIds.length === 0
        ? blockedReasons.get(variants[0].id)
        : undefined,
    state: getGroupSelectionState(selectableIds, selectedIds),
  }
}

/**
 * The last checkbox toggled, and its group. Shift-click on another checkbox in the same group
 * selects (or deselects) every selectable row between the two.
 *
 * @internal
 */
export type RangeAnchor = {setKey: string; variantId: string} | null

/**
 * The selection machine event for a row checkbox click, and the anchor to keep for the next one.
 * A plain click toggles the row. A Shift-click after a click in the same group gives the whole
 * range the state the clicked row is moving to.
 *
 * @internal
 */
export function getRowToggle({
  setKey,
  selectableIds,
  selectedIds,
  anchor,
  variantId,
  shiftKey,
}: {
  setKey: string
  selectableIds: readonly string[]
  selectedIds: ReadonlySet<string>
  anchor: RangeAnchor
  variantId: string
  shiftKey: boolean
}): {
  event:
    | {type: 'selection.toggle'; variantId: string}
    | {type: 'selection.addMany' | 'selection.removeMany'; variantIds: string[]}
  anchor: RangeAnchor
} {
  const nextAnchor = {setKey, variantId}
  const range =
    shiftKey && anchor?.setKey === setKey && anchor.variantId !== variantId
      ? getRangeIds(selectableIds, anchor.variantId, variantId)
      : []

  if (range.length === 0) {
    return {event: {type: 'selection.toggle', variantId}, anchor: nextAnchor}
  }

  return {
    event: {
      type: selectedIds.has(variantId) ? 'selection.removeMany' : 'selection.addMany',
      variantIds: range,
    },
    anchor: nextAnchor,
  }
}

/**
 * The selected versions that can no longer be selected, as when a release is scheduled after its
 * version was checked. They should leave the selection: their checkbox shows unchecked.
 *
 * @internal
 */
export function getBlockedSelectedIds<V extends {id: string}>({
  variants,
  selectedIds,
  getRelease,
}: {
  variants: readonly V[]
  selectedIds: ReadonlySet<string>
  getRelease: (variant: V) => ReleaseDocument | undefined
}): string[] {
  return variants
    .filter(
      (variant) =>
        selectedIds.has(variant.id) && getSelectionBlockedReason(getRelease(variant)) !== undefined,
    )
    .map(({id}) => id)
}
