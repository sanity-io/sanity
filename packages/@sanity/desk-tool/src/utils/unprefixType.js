// Hack for now until we figure out what the references should look like
export function unprefixType(doc) {
  return doc && Object.assign({}, doc, {
    $type: doc.$type.split('.').slice().pop()
  })
}
