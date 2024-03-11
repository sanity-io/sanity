import {type DecOp, type IncOp} from '../../../mutations/operations/types'

export function inc<O extends IncOp<number>, CurrentValue extends number>(
  op: O,
  currentValue: CurrentValue,
) {
  if (typeof currentValue !== 'number') {
    throw new TypeError('Cannot apply "inc()" on non-numeric value')
  }

  return currentValue + op.amount
}

export function dec<O extends DecOp<number>, CurrentValue extends number>(
  op: O,
  currentValue: CurrentValue,
) {
  if (typeof currentValue !== 'number') {
    throw new TypeError('Cannot apply "dec()" on non-numeric value')
  }

  return currentValue - op.amount
}
