export function isLegacyOptionsItem(item: any) {
  if (item && typeof item === 'object') {
    const keys = Object.keys(item)
    if (keys.length <= 2 && 'value' in item) {
      return true
    }
  }
  return false
}

export function resolveValueWithLegacyOptionsSupport(item: any) {
  return isLegacyOptionsItem(item) ? item.value : item
}
