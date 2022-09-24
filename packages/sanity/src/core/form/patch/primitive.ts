import {FIXME} from '../../FIXME'

const OPERATIONS = {
  replace(currentValue: FIXME, nextValue: FIXME) {
    return nextValue
  },
  set(currentValue: FIXME, nextValue: FIXME) {
    return nextValue
  },
  setIfMissing(currentValue: FIXME, nextValue: FIXME) {
    return currentValue === undefined ? nextValue : currentValue
  },
  unset(currentValue: FIXME, nextValue: FIXME) {
    return undefined
  },
  inc(currentValue: FIXME, nextValue: FIXME) {
    return currentValue + nextValue
  },
  dec(currentValue: FIXME, nextValue: FIXME) {
    return currentValue - nextValue
  },
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export function _primitiveApply(value: FIXME, patch: FIXME) {
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
        .map((path: FIXME) => JSON.stringify(path))
        .join('.')} that targeted the value "${JSON.stringify(value)}"`
    )
  }

  return (OPERATIONS as FIXME)[patch.type](value, patch.value)
}
