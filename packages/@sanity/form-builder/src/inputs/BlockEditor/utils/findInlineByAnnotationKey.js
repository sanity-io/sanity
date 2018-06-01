export default function findInlineByAnnotationKey(key, document) {
  return document
    .filterDescendants(desc => {
      if (desc.object !== 'inline') {
        return false
      }
      const annotations = desc.data.get('annotations')
      if (!annotations) {
        return false
      }
      return Object.keys(annotations).find(annotationName => {
        return annotations[annotationName]._key === key
      })
    })
    .get(0)
}
