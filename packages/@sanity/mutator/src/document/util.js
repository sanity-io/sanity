// Given any valid Sanity patch, extracts the ID of the document
// being modified - if any
export function extractIdFromPatch(patch): string {
  const extractInner = attrs => {
    if (typeof attrs != 'object') {
      return null
    }
    for (const key in attrs) {
      if (key === '_id' || key === 'id') {
        return attrs[key]
      }
      if (key === '_id' || key === 'id') {
        return extractInner(attrs[key])
      }
    }
    return null
  }
  return extractInner(patch)
}
