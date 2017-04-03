
const OPERATIONS = {
  replace(currentValue, nextValue) {
    return nextValue
  },
  set(currentValue, nextValue) {
    return nextValue
  },
  setIfMissing(currentValue, nextValue) {
    return (currentValue === undefined) ? nextValue : currentValue
  },
  unset(currentValue, nextValue) {
    return undefined
  },
  inc(currentValue, nextValue) {
    return currentValue + nextValue
  },
  dec(currentValue, nextValue) {
    return currentValue - nextValue
  }
}

const SUPPORTED_PATCH_TYPES = Object.keys(OPERATIONS)

export default function apply(value, patch) {

  if (!SUPPORTED_PATCH_TYPES.includes(patch.type)) {
    throw new Error(
      `Default value container received patch of unsupported type: "${JSON.stringify(patch.type)}". This is most likely a bug.`
    )
  }

  if (patch.path.length > 0) {
    throw new Error(`Default container cannot apply deep operations. Received patch with type "${patch.type}" and path "${patch.path.join('.')}"`)
  }

  return OPERATIONS[patch.type](value, patch.value)
}
