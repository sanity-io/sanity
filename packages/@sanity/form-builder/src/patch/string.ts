import * as DMP from 'diff-match-patch'

const dmp = new DMP.diff_match_patch()

const OPERATIONS = {
  replace(currentValue, nextValue) {
    return nextValue
  },
  set(currentValue, nextValue) {
    return nextValue
  },
  setIfMissing(currentValue, nextValue) {
    return currentValue === undefined ? nextValue : currentValue
  },
  unset(currentValue, nextValue) {
    return undefined
  },
  diffMatchPatch(currentValue, nextValue) {
    return dmp.patch_apply(dmp.patch_fromText(nextValue), currentValue)[0]
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export default function apply(value, patch) {
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

  return OPERATIONS[patch.type](value, patch.value)
}
