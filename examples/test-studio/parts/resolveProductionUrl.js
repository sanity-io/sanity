const PREVIEW_TYPES = ['book', 'author']

export default function resolveProductionUrl(document, rev) {
  if (rev) {
    // Historic revision of the document exists
    return (
      PREVIEW_TYPES.includes(document._type) &&
      `https://example.com/preview/${document._id}?rev=${rev}`
    )
  }
  return PREVIEW_TYPES.includes(document._type) && `https://example.com/preview/${document._id}`
}
