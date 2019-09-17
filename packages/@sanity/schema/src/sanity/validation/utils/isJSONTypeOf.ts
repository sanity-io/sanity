export function isJSONTypeOf(type, jsonType, visitorContext) {
  if ('jsonType' in type) {
    return type.jsonType === jsonType
  }
  const parentType = visitorContext.getType(type.type)
  if (!parentType) {
    throw new Error(`Could not resolve jsonType of ${type.name}. No parent type found`)
  }
  return isJSONTypeOf(parentType, jsonType, visitorContext)
}
