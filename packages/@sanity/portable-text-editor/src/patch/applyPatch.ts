import {isObject, isString} from 'lodash'
import applyArrayPatch from './array'
import applyObjectPatch from './object'
import applyPrimitivePatch from './primitive'
import applyStringPatch from './string'

export function applyAll(value: any, patches: any[]) {
  return patches.reduce(_apply, value)
}

function applyPatch(value: string, patch: {type: string; path: any[]; value: any}) {
  if (Array.isArray(value)) {
    return applyArrayPatch(value, patch as any)
  }
  if (isString(value)) {
    return applyStringPatch(value, patch)
  }
  if (isObject(value)) {
    return applyObjectPatch(value, patch)
  }
  return applyPrimitivePatch(value, patch)
}

export default function _apply(value: string, patch: {type: string; path: any[]; value: any}) {
  const res = applyPatch(value, patch)
  // console.log('applyPatch(%o, %o) : %o (noop? %o)', value, patch, res, value === res)
  return res
}
