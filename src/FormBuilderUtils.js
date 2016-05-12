const valueContainerSymbol = Symbol('valueContainerSymbol')

export function unwrap(value) {
  if (typeof value === 'object' && value !== null) {
    const valueContainer = value[valueContainerSymbol]
    if (valueContainer && valueContainer.unwrap) {
      return unwrap(valueContainer.unwrap(value))
    }
    if (Array.isArray(value)) {
      return value.map(unwrap)
    }
    return Object.keys(value).reduce((unwrapped, key) => {
      unwrapped[key] = unwrap(value[key])
      return unwrapped
    }, {})
  }
  return value
}

export function isWrapped(value) {
  return !!(value && value[valueContainerSymbol])
}

export function markWrapped(value, valueContainer) {
  value[valueContainerSymbol] = valueContainer
  return value
}

export function maybeWrapValue(value, valueContainer) {
  if (!(valueContainer || {}).wrap) {
    return value
  }
  if (value && value[valueContainerSymbol]) {
    return value
  }
  const wrapped = valueContainer.wrap(value)
  wrapped[valueContainerSymbol] = true
  return wrapped
}
