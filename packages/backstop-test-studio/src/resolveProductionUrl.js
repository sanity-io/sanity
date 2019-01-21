const PREVIEW_TYPES = ['book', 'author']

export default function resolveProductionUrl(document) {
  return PREVIEW_TYPES.includes(document._type) && `https://example.com/preview/${document._id}`
}
