import {isObject} from 'lodash'
import applyArrayPatch from './patch/array'
import applyObjectPatch from './patch/object'
import applyPrimitivePatch from './patch/primitive'

export default function applyPatch(value, patch) {
  if (Array.isArray(value)) {
    return applyArrayPatch(value, patch)
  }
  if (isObject(value)) {
    return applyObjectPatch(value, patch)
  }
  return applyPrimitivePatch(value, patch)
}
