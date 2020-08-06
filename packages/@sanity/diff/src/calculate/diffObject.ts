import {ObjectDiff, ObjectInput, DiffOptions, NoDiff} from '../types'
import {diffInput} from './diffInput'

const ignoredFields = new Set(['_id', '_type', '_createdAt', '_updatedAt', '_rev'])

export function diffObject<A>(
  fromInput: ObjectInput<A>,
  toInput: ObjectInput<A>,
  options: DiffOptions
): ObjectDiff<A> | NoDiff {
  const fields: ObjectDiff<A>['fields'] = {}
  let isChanged = false

  // TODO: Handle nulls

  for (let key of fromInput.keys) {
    if (ignoredFields.has(key)) continue

    let fromField = fromInput.get(key)!

    let toField = toInput.get(key)
    if (toField) {
      let diff = diffInput(fromField, toField, options)
      let fromValue = fromField.value
      let toValue = toField.value

      if (diff.isChanged) {
        fields[key] = {
          type: 'changed',
          isChanged: true,
          fromValue,
          toValue,
          diff
        }
        isChanged = true
      } else {
        fields[key] = {
          type: 'unchanged',
          isChanged: false,
          fromValue,
          toValue
        }
      }
    } else {
      fields[key] = {
        type: 'removed',
        isChanged: true,
        fromValue: fromField.value,
        toValue: undefined,
        annotation: fromInput.annotation
      }
      isChanged = true
    }
  }

  for (let key of toInput.keys) {
    if (ignoredFields.has(key)) continue

    // Already handled above
    if (fromInput.get(key)) continue

    let toField = toInput.get(key)!
    fields[key] = {
      type: 'added',
      isChanged: true,
      fromValue: undefined,
      toValue: toField.value,
      annotation: toInput.annotation
    }
    isChanged = true
  }

  const fromValue = fromInput.value
  const toValue = toInput.value

  if (!isChanged)
    return {
      type: 'unchanged',
      isChanged: false,
      fromValue,
      toValue
    }

  return {
    type: 'object',
    isChanged: true,
    fromValue,
    toValue,
    fields
  }
}
