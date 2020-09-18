import {ChangeNode, Diff, FieldChangeNode, GroupChangeNode} from '../types'

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

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
