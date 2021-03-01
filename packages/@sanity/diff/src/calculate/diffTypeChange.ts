import {TypeChangeDiff, Input, DiffOptions} from '../types'
import {removedInput, addedInput} from './diffInput'

export function diffTypeChange<A>(
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions
): TypeChangeDiff<A> {
  return {
    type: 'typeChange',
    action: 'changed',
    isChanged: true,

    fromType: fromInput.type,
    fromValue: fromInput.value,
    fromDiff: removedInput(fromInput, undefined, options),

    toType: toInput.type,
    toValue: toInput.value,
    toDiff: addedInput(toInput, undefined, options),

    annotation: toInput.annotation,
  }
}
