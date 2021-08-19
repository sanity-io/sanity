import * as DMP from 'diff-match-patch'

// eslint-disable-next-line new-cap
const dmp = new DMP.diff_match_patch()

type fn = (oldVal: any, newVal: any) => any
const OPERATIONS: Record<string, fn> = {
  replace(currentValue: any, nextValue: any) {
    return nextValue
  },
  set(currentValue: any, nextValue: any) {
    return nextValue
  },
  setIfMissing(currentValue: undefined, nextValue: any) {
    return currentValue === undefined ? nextValue : currentValue
  },
  unset(currentValue: any, nextValue: any) {
    return undefined
  },
  diffMatchPatch(currentValue: string, nextValue: string) {
    return dmp.patch_apply(dmp.patch_fromText(nextValue), currentValue)[0]
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export default function apply(
  value: string,
  patch: {type: string; path: any[]; value: any}
): string {
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
  const func = OPERATIONS[patch.type]
  if (func) {
    return func(value, patch.value)
  }
  throw new Error('Unknown patch type')
}
