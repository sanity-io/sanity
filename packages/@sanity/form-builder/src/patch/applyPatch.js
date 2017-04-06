import {isObject} from 'lodash'
import applyArrayPatch from './array'
import applyObjectPatch from './object'
import applyPrimitivePatch from './primitive'

export function applyAll(value, patches) {
  return patches.reduce(_apply, value)
}

function applyPatch(value, patch) {
  if (Array.isArray(value)) {
    return applyArrayPatch(value, patch)
  }
  if (isObject(value)) {
    return applyObjectPatch(value, patch)
  }
  return applyPrimitivePatch(value, patch)
}

export default function _apply(value, patch) {
  const res = applyPatch(value, patch)
  // console.log('applyPatch(%o, %o) : %o (noop? %o)', value, patch, res, value === res)
  return res
}
