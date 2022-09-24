import {omit, clone, isObject} from 'lodash'
import {FIXME} from '../../FIXME'
import {applyPatch} from './applyPatch'

export function _objectApply(value: FIXME, patch: FIXME) {
  const nextValue = clone(value)
  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'set') {
      if (!isObject(patch.value)) {
        // eslint-disable-line max-depth
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
