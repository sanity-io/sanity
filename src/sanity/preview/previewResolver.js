import Reference from './Reference'
import DefaultPreview from './DefaultPreview'

export default function previewResolver(field) {
  if (field.type === 'reference') {
    return Reference
  }
  // todo: need a way to be able to use custom previews
  return DefaultPreview
}
