// Hack for now until we figure out what the references should look like
export function unprefixType(doc) {
  return doc && Object.assign({}, doc, {
    _type: doc._type.split('.').slice().pop()
  })
}
