import {isObject} from 'lodash'
import applyArrayPatch from './array'
import applyObjectPatch from './object'
import applyPrimitivePatch from './primitive'

export default function applyPatch(value, patch) {
  if (Array.isArray(value)) {
    return applyArrayPatch(value, patch)
  }
  if (isObject(value)) {
    return applyObjectPatch(value, patch)
  }
  return applyPrimitivePatch(value, patch)
}
