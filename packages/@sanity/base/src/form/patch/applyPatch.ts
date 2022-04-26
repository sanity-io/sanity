import {isObject, isString} from 'lodash'
import {PatchArg} from '../../_exports'
import {FIXME} from '../types'
import {_arrayApply} from './array'
import {_objectApply} from './object'
import {_primitiveApply} from './primitive'
import {_stringApply} from './string'

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
