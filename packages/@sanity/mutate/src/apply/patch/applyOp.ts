import {
  type AnyOp,
  type ArrayOp,
  type NumberOp,
  type ObjectOp,
  type Operation,
  type StringOp,
} from '../../mutations/operations/types'
import {type AnyArray} from '../../utils/typeUtils'
import * as operations from './operations'
import {type ApplyOp} from './typings/applyOp'

export function applyOp<const Op extends AnyOp, const CurrentValue>(
  op: Op,
  currentValue: CurrentValue,
): ApplyOp<Op, CurrentValue>
export function applyOp<
  const Op extends NumberOp,
  const CurrentValue extends number,
>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>
export function applyOp<
  const Op extends StringOp,
  const CurrentValue extends string,
>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>
export function applyOp<
  const Op extends ObjectOp,
  const CurrentValue extends {[k in keyof any]: unknown},
>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>
export function applyOp<
  const Op extends ArrayOp,
  const CurrentValue extends AnyArray,
>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>
export function applyOp<const Op extends Operation, const CurrentValue>(
  op: Op,
  currentValue: CurrentValue,
): ApplyOp<Op, CurrentValue> {
  if (!(op.type in operations)) {
    throw new Error(`Invalid operation type: "${op.type}"`)
  }

  return (operations[op.type] as CallableFunction)(op, currentValue)
}
