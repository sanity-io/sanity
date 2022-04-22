import * as DMP from 'diff-match-patch'
import {FormPatch} from '../patch'
import {FIXME} from '../types'

// eslint-disable-next-line new-cap
const dmp = new DMP.diff_match_patch()

const OPERATIONS = {
  replace(currentValue: unknown, nextValue: unknown) {
    return nextValue
  },
  set(currentValue: unknown, nextValue: unknown) {
    return nextValue
  },
  setIfMissing(currentValue: unknown, nextValue: unknown) {
    return currentValue === undefined ? nextValue : currentValue
  },
  unset(currentValue: unknown, nextValue: unknown) {
    return undefined
  },
  diffMatchPatch(currentValue: string, nextValue: string) {
    return dmp.patch_apply(dmp.patch_fromText(nextValue), currentValue)[0]
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export function _stringApply(value: unknown, patch: FormPatch) {
  if (!SUPPORTED_PATCH_TYPES.includes(patch.type)) {
    throw new Error(
      `Received patch of unsupported type: "${JSON.stringify(
        patch.type
      )}" for string. This is most likely a bug.`
    )
  }

  if (patch.path.length > 0) {
    throw new Error(
      `Cannot apply deep operations on string values. Received patch with type "${
        patch.type
      }" and path "${patch.path.join('.')} that targeted the value "${JSON.stringify(value)}"`
    )
  }

  return (OPERATIONS as FIXME)[patch.type](value, (patch as FIXME).value)
}
