import {
  Diff,
  Input,
  ArrayInput,
  StringInput,
  ObjectInput,
  DiffOptions,
  NoDiff,
  BooleanInput,
  NumberInput
} from '../types'
import {diffArray} from './diffArray'
import {diffString} from './diffString'
import {diffTypeChange} from './diffTypeChange'
import {diffObject} from './diffObject'
import {diffSimple} from './diffSimple'

export function diffInput<A>(
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions = {}
): Diff<A> | NoDiff {
  // eg: null/undefined => string
  if (fromInput.type !== toInput.type) {
    return diffTypeChange(fromInput, toInput, options)
  }

  return diffWithType(fromInput.type, fromInput, toInput, options)
}

const nullNoDiff: NoDiff = {type: 'unchanged', isChanged: false, fromValue: null, toValue: null}

function diffWithType<A>(
  type: Input<A>['type'],
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions
): Diff<A> | NoDiff {
  switch (type) {
    case 'null':
      return nullNoDiff
    case 'boolean':
      return diffSimple(fromInput as BooleanInput<A>, toInput as BooleanInput<A>, options)
    case 'number':
      return diffSimple(fromInput as NumberInput<A>, toInput as NumberInput<A>, options)
    case 'string':
      return diffString(fromInput as StringInput<A>, toInput as StringInput<A>, options)
    case 'array':
      return diffArray(fromInput as ArrayInput<A>, toInput as ArrayInput<A>, options)
    case 'object':
      return diffObject(fromInput as ObjectInput<A>, toInput as ObjectInput<A>, options)
  }
}
