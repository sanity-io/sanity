import type {
  Diff,
  Input,
  ArrayInput,
  StringInput,
  ObjectInput,
  DiffOptions,
  BooleanInput,
  NumberInput,
} from '../types'
import {diffArray, addedArray, removedArray} from './diffArray'
import {diffString, removedString, addedString} from './diffString'
import {diffTypeChange} from './diffTypeChange'
import {diffObject, removedObject, addedObject} from './diffObject'
import {diffBoolean, diffNumber} from './diffSimple'

/**
 * Takes a `from` and `to` input and calulates a diff between the two
 *
 * @param fromInput - The source (`from`) input - use {@link wrap | the wrap() method} to generate an "input"
 * @param toInput - The destination (`to`) input - use {@link wrap | the wrap() method} to generate an "input"
 * @param options - Options for the diffing process - currently no options are defined
 * @returns A diff object representing the change
 * @public
 */
export function diffInput<A>(
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions = {}
): Diff<A> {
  if (fromInput.type !== toInput.type) {
    if (fromInput.type === 'null') {
      return addedInput(toInput, null, options)
    }

    if (toInput.type === 'null') {
      return removedInput(fromInput, null, options)
    }

    return diffTypeChange(fromInput, toInput, options)
  }

  return diffWithType(fromInput.type, fromInput, toInput, options)
}

function diffWithType<A>(
  type: Input<A>['type'],
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions
): Diff<A> {
  switch (type) {
    case 'null':
      return {
        type: 'null',
        action: 'unchanged',
        isChanged: false,
        toValue: null,
        fromValue: null,
      }
    case 'boolean':
      return diffBoolean(fromInput as BooleanInput<A>, toInput as BooleanInput<A>, options)
    case 'number':
      return diffNumber(fromInput as NumberInput<A>, toInput as NumberInput<A>, options)
    case 'string':
      return diffString(fromInput as StringInput<A>, toInput as StringInput<A>, options)
    case 'array':
      return diffArray(fromInput as ArrayInput<A>, toInput as ArrayInput<A>, options)
    case 'object':
      return diffObject(fromInput as ObjectInput<A>, toInput as ObjectInput<A>, options)
    default:
      throw new Error(`Unhandled diff type "${type}"`)
  }
}

export function removedInput<A>(
  input: Input<A>,
  toValue: null | undefined,
  options: DiffOptions
): Diff<A> & {action: 'removed'} {
  switch (input.type) {
    case 'null':
      return {
        type: 'null',
        action: 'removed',
        isChanged: true,
        fromValue: null,
        toValue,
        annotation: input.annotation,
      }
    case 'boolean':
      return {
        type: 'boolean',
        action: 'removed',
        isChanged: true,
        fromValue: input.value,
        toValue,
        annotation: input.annotation,
      }
    case 'number':
      return {
        type: 'number',
        action: 'removed',
        isChanged: true,
        fromValue: input.value,
        toValue,
        annotation: input.annotation,
      }
    case 'string':
      return removedString(input, toValue, options)
    case 'array':
      return removedArray(input, toValue, options)
    case 'object':
      return removedObject(input, toValue, options)
    default:
      throw new Error('Unhandled diff type')
  }
}

export function addedInput<A>(
  input: Input<A>,
  fromValue: null | undefined,
  options: DiffOptions
): Diff<A> & {action: 'added'} {
  switch (input.type) {
    case 'null':
      return {
        type: 'null',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: null,
        annotation: input.annotation,
      }
    case 'boolean':
      return {
        type: 'boolean',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: input.value,
        annotation: input.annotation,
      }
    case 'number':
      return {
        type: 'number',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: input.value,
        annotation: input.annotation,
      }
    case 'string':
      return addedString(input, fromValue, options)
    case 'array':
      return addedArray(input, fromValue, options)
    case 'object':
      return addedObject(input, fromValue, options)
    default:
      throw new Error('Unhandled diff type')
  }
}
