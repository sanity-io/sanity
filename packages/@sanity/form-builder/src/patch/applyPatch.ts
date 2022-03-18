import {isObject, isString} from 'lodash'
import {_arrayApply} from './array'
import {_objectApply} from './object'
import {_primitiveApply} from './primitive'
import {_stringApply} from './string'

export function applyAll(value, patches) {
  return patches.reduce(applyPatch, value)
}

function _applyPatch(value, patch) {
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

export function applyPatch(value, patch) {
  const res = _applyPatch(value, patch)
  // console.log('applyPatch(%o, %o) : %o (noop? %o)', value, patch, res, value === res)
  return res
}
