import randomKey from './util/randomKey'

export function createProtoValue(type, key = undefined) {
  if (type.jsonType !== 'object') {
    throw new Error(
      `Invalid item type: "${JSON.stringify(
        type.jsonType
      )}". Block editor can only contain objects (for now)`
    )
  }
  return {
    _type: type.name,
    _key: key || randomKey(12)
  }
}
