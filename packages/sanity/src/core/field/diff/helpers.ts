import type {ChangeNode, Diff, FieldChangeNode, GroupChangeNode, ItemDiff} from '../types'

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

/** @internal */
export function isFieldChange(change: ChangeNode): change is FieldChangeNode {
  return change.type === 'field'
}

/** @internal */
export function isGroupChange(change: ChangeNode): change is GroupChangeNode {
  return change.type === 'group'
}

/** @internal */
export function isAddedItemDiff(
  item: ItemDiff,
): item is ItemDiff & {diff: Diff & {action: 'added'}} {
  return item.diff.action === 'added'
}

/** @internal */
export function isRemovedItemDiff(
  item: ItemDiff,
): item is ItemDiff & {diff: Diff & {action: 'removed'}} {
  return item.diff.action === 'removed'
}

/** @internal */
export function isUnchangedDiff(diff: Diff): diff is Diff & {action: 'unchanged'} {
  return diff.action === 'unchanged'
}
