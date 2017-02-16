
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
