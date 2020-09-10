import {Diff} from '../types'

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

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
