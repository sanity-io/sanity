import type {DiffOptions, NumberInput, BooleanInput, NumberDiff, BooleanDiff} from '../types'

export function diffNumber<A>(
  fromInput: NumberInput<A>,
  toInput: NumberInput<A>,
  options: DiffOptions,
): NumberDiff<A> {
  const fromValue = fromInput.value
  const toValue = toInput.value
  const type = fromInput.type

  if (fromValue === toValue)
    return {
      type,
      action: 'unchanged',
      fromValue,
      toValue,
      isChanged: false,
    }

  return {
    type: fromInput.type,
    action: 'changed',
    isChanged: true,
    fromValue: fromValue,
    toValue: toValue,
    annotation: toInput.annotation,
  }
}

export function diffBoolean<A>(
  fromInput: BooleanInput<A>,
  toInput: BooleanInput<A>,
  options: DiffOptions,
): BooleanDiff<A> {
  const fromValue = fromInput.value
  const toValue = toInput.value
  const type = fromInput.type

  if (fromValue === toValue)
    return {
      type,
      action: 'unchanged',
      fromValue,
      toValue,
      isChanged: false,
    }

  return {
    type: fromInput.type,
    action: 'changed',
    isChanged: true,
    fromValue: fromValue,
    toValue: toValue,
    annotation: toInput.annotation,
  }
}
