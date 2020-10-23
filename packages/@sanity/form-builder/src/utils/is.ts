const PRIMITIVES = ['string', 'number', 'boolean']

function is(typeName, type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}

export default is
export {is as type}

export function primitive(type) {
  return PRIMITIVES.some((typeName) => is(typeName, type))
}
