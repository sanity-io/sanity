import hasOwn from '../utils/hasOwn'
import {findIndex} from 'lodash'
import applyPatch from './applyPatch'
import insert from './arrayInsert'

function move(arr, from, to) {
  const nextValue = arr.slice()
  const val = nextValue[from]
  nextValue.splice(from, 1)
  nextValue.splice(to, 0, val)
  return nextValue
}

function findTargetIndex(array, pathSegment) {
  if (typeof pathSegment === 'number') {
    return pathSegment
  }
  return findIndex(array, pathSegment)
}

export default function apply(value, patch) {
  const nextValue = value.slice() // make a copy for internal mutation

  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'setIfMissing') {
      if (!Array.isArray(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Cannot set value of an array to a non-array')
      }
      return value === undefined ? patch.value : value
    } else if (patch.type === 'set') {
      if (!Array.isArray(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Cannot set value of an array to a non-array')
      }
      return patch.value
    } else if (patch.type === 'unset') {
      return undefined
    } else if (patch.type === 'move') {
      if (!patch.value || !hasOwn(patch.value, 'from') || !hasOwn(patch.value, 'to')) { // eslint-disable-line max-depth
        throw new Error(`Invalid value of 'move' patch. Expected a value with "from" and "to" indexes, instead got: ${JSON.stringify(patch.value)}`)
      }
      return move(nextValue, patch.value.from, patch.value.to)
    }
    throw new Error(`Invalid array operation: ${patch.type}`)
  }

  const [head, ...tail] = patch.path

  const index = findTargetIndex(value, head)

  if (tail.length === 0) {
    if (patch.type === 'insert') {
      const {position, items} = patch
      return insert(value, position, index, items)
    } else if (patch.type === 'unset') {
      if (typeof index !== 'number') {
        throw new Error(`Expected array index to be a number, instead got "${index}"`)
      }
      nextValue.splice(index, 1)
      return nextValue
    }
  }

  // The patch is not directed to me
  nextValue[index] = applyPatch(nextValue[index], {
    ...patch,
    path: tail
  })
  return nextValue
}
