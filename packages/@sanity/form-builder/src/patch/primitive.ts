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
  inc(currentValue, nextValue) {
    return currentValue + nextValue
  },
  dec(currentValue, nextValue) {
    return currentValue - nextValue
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export default function apply(value, patch) {
  if (!SUPPORTED_PATCH_TYPES.includes(patch.type)) {
    throw new Error(
      `Received patch of unsupported type "${patch.type}" for primitives. This is most likely a bug.`
    )
  }

  if (patch.path.length > 0) {
    throw new Error(
      `Cannot apply deep operations on primitive values. Received patch with type "${
        patch.type
      }" and path "${patch.path
        .map((path) => JSON.stringify(path))
        .join('.')} that targeted the value "${JSON.stringify(value)}"`
    )
  }

  return OPERATIONS[patch.type](value, patch.value)
}
