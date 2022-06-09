import {ChangeNode, Diff, FieldChangeNode, GroupChangeNode, ItemDiff} from '../types'

export function getChangeVerb(diff: Diff): 'Added' | 'Removed' | 'Changed' {
  const hadPrevValue = hasValue(diff.fromValue)
  const hasNextValue = hasValue(diff.toValue)
  if (!hadPrevValue && hasNextValue) {
    return 'Added'
  }

  if (!hasNextValue && hadPrevValue) {
    return 'Removed'
  }

  return 'Changed'
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

export function isFieldChange(change: ChangeNode): change is FieldChangeNode {
  return change.type === 'field'
}

export function isGroupChange(change: ChangeNode): change is GroupChangeNode {
  return change.type === 'group'
}

export function isAddedItemDiff(
  item: ItemDiff
): item is ItemDiff & {diff: Diff & {action: 'added'}} {
  return item.diff.action === 'added'
}

export function isRemovedItemDiff(
  item: ItemDiff
): item is ItemDiff & {diff: Diff & {action: 'removed'}} {
  return item.diff.action === 'removed'
}

export function isUnchangedDiff(diff: Diff): diff is Diff & {action: 'unchanged'} {
  return diff.action === 'unchanged'
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
