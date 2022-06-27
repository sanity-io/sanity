import type {ObjectDiff, ObjectInput, DiffOptions} from '../types'
import {replaceProperty} from '../helpers'
import {diffInput, removedInput, addedInput} from './diffInput'

const ignoredFields = new Set(['_id', '_type', '_createdAt', '_updatedAt', '_rev', '_weak'])

export function diffObject<A>(
  fromInput: ObjectInput<A>,
  toInput: ObjectInput<A>,
  options: DiffOptions
): ObjectDiff<A> {
  const fields: ObjectDiff<A>['fields'] = {}
  let isChanged = false

  for (const key of fromInput.keys) {
    if (ignoredFields.has(key)) continue

    const fromField = fromInput.get(key)!

    const toField = toInput.get(key)
    if (toField) {
      const fieldDiff = diffInput(fromField, toField, options)
      fields[key] = fieldDiff
      if (fieldDiff.isChanged) isChanged = true
    } else {
      fields[key] = removedInput(fromField, undefined, options)
      isChanged = true
    }
  }

  for (const key of toInput.keys) {
    if (ignoredFields.has(key)) continue

    // Already handled above
    if (fromInput.get(key)) continue

    const toField = toInput.get(key)!
    fields[key] = addedInput(toField, undefined, options)
    isChanged = true
  }

  const fromValue = fromInput.value
  const toValue = toInput.value

  if (!isChanged) {
    return {
      type: 'object',
      action: 'unchanged',
      isChanged: false,
      fromValue,
      toValue,
      fields,
    }
  }

  return {
    type: 'object',
    action: 'changed',
    isChanged: true,
    fromValue,
    toValue,
    fields,
    annotation: toInput.annotation,
  }
}

export function removedObject<A>(
  input: ObjectInput<A>,
  toValue: null | undefined,
  options: DiffOptions
): ObjectDiff<A> & {action: 'removed'} {
  return {
    type: 'object',
    action: 'removed',
    isChanged: true,
    fromValue: input.value,
    toValue,
    annotation: input.annotation,

    get fields(): ObjectDiff<A>['fields'] {
      const fields: ObjectDiff<A>['fields'] = {}
      for (const key of input.keys) {
        const value = input.get(key)!
        fields[key] = removedInput(value, undefined, options)
      }
      return replaceProperty(this, 'fields', fields)
    },
  }
}

export function addedObject<A>(
  input: ObjectInput<A>,
  fromValue: null | undefined,
  options: DiffOptions
): ObjectDiff<A> & {action: 'added'} {
  return {
    type: 'object',
    action: 'added',
    isChanged: true,
    fromValue,
    toValue: input.value,
    annotation: input.annotation,

    get fields(): ObjectDiff<A>['fields'] {
      const fields: ObjectDiff<A>['fields'] = {}
      for (const key of input.keys) {
        const value = input.get(key)!
        fields[key] = addedInput(value, undefined, options)
      }
      return replaceProperty(this, 'fields', fields)
    },
  }
}
