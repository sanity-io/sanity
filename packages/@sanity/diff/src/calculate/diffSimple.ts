import {SimpleDiff, DiffOptions, NoDiff, NumberInput, BooleanInput} from '../types'

export function diffSimple<A, I extends NumberInput<A> | BooleanInput<A>>(
  fromInput: I,
  toInput: I,
  options: DiffOptions
): SimpleDiff<A> | NoDiff {
  const fromValue = fromInput.value
  const toValue = toInput.value

  if (fromValue === toValue)
    return {
      type: 'unchanged',
      fromValue,
      toValue,
      isChanged: false
    }

  return {
    type: fromInput.type,
    isChanged: true,
    fromValue: fromValue as any,
    toValue: toValue as any,
    annotation: toInput.annotation
  }
}
