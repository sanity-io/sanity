import {
  type SetIfMissingOp,
  type SetOp,
  type UnsetOp,
} from '../../../mutations/operations/types'

export function set<O extends SetOp<any>, CurrentValue>(
  op: O,
  currentValue: CurrentValue,
) {
  return op.value
}

export function setIfMissing<O extends SetIfMissingOp<any>, CurrentValue>(
  op: O,
  currentValue: CurrentValue,
) {
  return currentValue ?? op.value
}

export function unset<O extends UnsetOp, CurrentValue>(op: O) {
  return undefined
}
