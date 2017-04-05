import randomKey from './util/randomKey'

export function createProtoValue(type) {
  if (type.jsonType !== 'object') {
    throw new Error(`Invalid item type: "${type.type}". Block editor can only contain objects (for now)`)
  }
  return {
    _type: type.name,
    _key: randomKey(12)
  }
}
