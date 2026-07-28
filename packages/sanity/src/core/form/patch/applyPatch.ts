import clone from 'lodash-es/clone.js'
import findIndex from 'lodash-es/findIndex.js'
import isObject from 'lodash-es/isObject.js'
import isString from 'lodash-es/isString.js'
import omit from 'lodash-es/omit.js'

import {type FIXME} from '../../FIXME'
import {arrayInsert} from './arrayInsert'
import {_primitiveApply} from './primitive'
import {_stringApply} from './string'
import {type PatchArg} from './types'

// `applyPatch` and the array/object appliers are mutually recursive (container patches recurse
// into their members), so they live in the same module to avoid circular imports.

export function applyAll(value: FIXME, patches: PatchArg[]) {
  return patches.reduce(applyPatch, value)
}

function _applyPatch(value: FIXME, patch: FIXME) {
  if (Array.isArray(value)) {
    return _arrayApply(value, patch)
  }
  if (isString(value)) {
    return _stringApply(value, patch)
  }
  if (isObject(value)) {
    return _objectApply(value, patch)
  }
  return _primitiveApply(value, patch)
}

export function applyPatch(value: FIXME, patch: FIXME) {
  const res = _applyPatch(value, patch)
  // console.log('applyPatch(%o, %o) : %o (noop? %o)', value, patch, res, value === res)
  return res
}

const hasOwn = (obj: Record<string, unknown>, property: string) =>
  Object.prototype.hasOwnProperty.call(obj, property)

function move(arr: unknown[], from: number, to: number) {
  const nextValue = arr.slice()
  const val = nextValue[from]
  nextValue.splice(from, 1)
  nextValue.splice(to, 0, val)
  return nextValue
}

function findTargetIndex(array: unknown[], pathSegment: FIXME) {
  if (typeof pathSegment === 'number') {
    return pathSegment
  }
  const index = findIndex(array, pathSegment)
  return index === -1 ? false : index
}

function _arrayApply(value: FIXME, patch: FIXME) {
  const nextValue = value.slice() // make a copy for internal mutation

  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'setIfMissing') {
      if (!Array.isArray(patch.value)) {
        throw new Error('Cannot set value of an array to a non-array')
      }
      return value === undefined ? patch.value : value
    } else if (patch.type === 'set') {
      if (!Array.isArray(patch.value)) {
        throw new Error('Cannot set value of an array to a non-array')
      }
      return patch.value
    } else if (patch.type === 'unset') {
      return undefined
    } else if (patch.type === 'move') {
      if (!patch.value || !hasOwn(patch.value, 'from') || !hasOwn(patch.value, 'to')) {
        throw new Error(
          `Invalid value of 'move' patch. Expected a value with "from" and "to" indexes, instead got: ${JSON.stringify(
            patch.value,
          )}`,
        )
      }
      return move(nextValue, patch.value.from, patch.value.to)
    }
    throw new Error(`Invalid array operation: ${patch.type}`)
  }

  const [head, ...tail] = patch.path

  const index = findTargetIndex(value, head)

  // If the given selector could not be found, return as-is
  if (index === false) {
    return nextValue
  }

  if (tail.length === 0) {
    if (patch.type === 'insert') {
      const {position, items} = patch
      return arrayInsert(value, position, index, items)
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
    path: tail,
  })
  return nextValue
}

function _objectApply(value: FIXME, patch: FIXME) {
  const nextValue = clone(value)
  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'set') {
      if (!isObject(patch.value)) {
        throw new Error('Cannot set value of an object to a non-object')
      }
      return patch.value
    } else if (patch.type === 'unset') {
      return undefined
    } else if (patch.type === 'setIfMissing') {
      // console.log('IS IT missing?', value)
      return value === undefined ? patch.value : value
    }
    throw new Error(`Invalid object operation: ${patch.type}`)
  }

  // The patch is not directed to me
  const [head, ...tail] = patch.path
  if (typeof head !== 'string') {
    throw new Error(`Expected field name to be a string, instad got: ${head}`)
  }

  if (tail.length === 0 && patch.type === 'unset') {
    return omit(nextValue, head)
  }

  nextValue[head] = applyPatch(nextValue[head], {
    ...patch,
    path: tail,
  })
  return nextValue
}
