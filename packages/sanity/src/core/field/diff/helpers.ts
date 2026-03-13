import {type SchemaType} from '@sanity/types'

import {
  type ChangeNode,
  type Diff,
  type FieldChangeNode,
  type GroupChangeNode,
  type ItemDiff,
} from '../types'

/** @internal */
// eslint-disable-next-line no-empty-function
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

/**
 * A map of supported JSON types to valid empty values that may be used for diffing purposes when
 * the node has no underlying value to be compared with.
 *
 * @internal
 */
export const emptyValuesByType = {
  string: '',
  number: 0,
  boolean: false,
  array: [],
  object: {},
} satisfies Record<SchemaType['jsonType'], unknown>
