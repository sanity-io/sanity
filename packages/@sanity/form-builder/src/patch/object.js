import {clone, isObject} from 'lodash'
import defaultApplyPatch from './defaultApplyPatch'

function defaultCreateItem(item) {
  return item
}

export default function apply(value = {}, patch, {applyItemPatch = defaultApplyPatch, createItem = defaultCreateItem} = {}) {
  const nextValue = clone(value)
  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'set') {
      if (!isObject(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Cannot set value of an object to a non-object')
      }
      return patch.value
    } else if (patch.type === 'unset') {
      return undefined
    } else if (patch.type === 'merge') {
      // Turn into a 'set' with paths
      if (!isObject(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Non-object argument used with the "merge" patch type.')
      }
      const toMerge = Object.keys(patch.value).reduce((acc, property) => {
        acc[property] = createItem(patch.value[property], property)
        return acc
      }, {})
      return Object.assign(nextValue, toMerge)
    }
    throw new Error(`Invalid object operation: ${patch.type}`)
  }

  // The patch is not directed to me
  const [fieldName, ...rest] = patch.path
  if (typeof fieldName !== 'string') {
    throw new Error(`Expected field name to be a string, instad got: ${fieldName}`)
  }
  nextValue[fieldName] = applyItemPatch(nextValue[fieldName], {
    ...patch,
    path: rest
  })
  return nextValue
}
