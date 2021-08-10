const OPERATIONS: Record<string, any> = {
  replace(_currentValue: any, nextValue: any) {
    return nextValue
  },
  set(_currentValue: any, nextValue: any) {
    return nextValue
  },
  setIfMissing(currentValue: any, nextValue: any) {
    return currentValue === undefined ? nextValue : currentValue
  },
  unset(_currentValue: any, _nextValue: any) {
    return undefined
  },
  inc(currentValue: any, nextValue: any) {
    return currentValue + nextValue
  },
  dec(currentValue: any, nextValue: any) {
    return currentValue - nextValue
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export default function apply(value: any, patch: any) {
  if (!SUPPORTED_PATCH_TYPES.includes(patch.type)) {
    throw new Error(
      `Received patch of unsupported type: "${JSON.stringify(
        patch.type
      )}" for primitives. This is most likely a bug.`
    )
  }

  if (patch.path.length > 0) {
    throw new Error(
      `Cannot apply deep operations on primitive values. Received patch with type "${
        patch.type
      }" and path "${patch.path
        .map((path: any) => JSON.stringify(path))
        .join('.')} that targeted the value "${JSON.stringify(value)}"`
    )
  }
  return OPERATIONS[patch.type](value, patch.value)
}
