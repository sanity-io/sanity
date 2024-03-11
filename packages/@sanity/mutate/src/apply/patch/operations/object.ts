import {
  type AssignOp,
  type UnassignOp,
} from '../../../mutations/operations/types'
import {isObject} from '../../../utils/isObject'
import {isEmpty} from '../../utils/isEmpty'
import {omit} from '../../utils/omit'

export function unassign<T extends object, K extends string[]>(
  op: UnassignOp<K>,
  currentValue: T,
) {
  if (!isObject(currentValue)) {
    throw new TypeError('Cannot apply "unassign()" on non-object value')
  }

  return op.keys.length === 0
    ? currentValue
    : omit(currentValue, op.keys as any[])
}

export function assign<T extends object>(op: AssignOp<T>, currentValue: T) {
  if (!isObject(currentValue)) {
    throw new TypeError('Cannot apply "assign()" on non-object value')
  }

  return isEmpty(op.value) ? currentValue : {...currentValue, ...op.value}
}
