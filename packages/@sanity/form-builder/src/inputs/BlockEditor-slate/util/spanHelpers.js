// TODO: Temporary workaround: This nees to be rewritten into something more robust ASAP
export function getLinkField(blockArrayType) {
  return getSpanField(blockArrayType).type.fields.find(field => field.name === 'link')
}

export function getSpanField(blockArrayType) {
  return getSpansField(blockArrayType)
    .type.of.find(field => field.name === 'span')
}

export function getSpansField(blockArrayType) {
  return getBlockField(blockArrayType)
    .fields.find(field => field.name === 'spans')
}

export function getBlockField(blockArrayType) {
  return blockArrayType.of.find(ofType => ofType.type.name === 'block')
}
