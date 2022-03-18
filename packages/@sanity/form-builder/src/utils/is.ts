const PRIMITIVES = ['string', 'number', 'boolean']

export function is(typeName, type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}

export {is as type}

export function primitive(type) {
  return PRIMITIVES.some((typeName) => is(typeName, type))
}
