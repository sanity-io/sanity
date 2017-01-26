import Reference from './Reference'
import SanityPreviewComponent from './SanityPreviewComponent'

export default function previewResolver(type) {
  if (type.name === 'reference') {
    return Reference
  }
  // todo: need a way to be able to use custom previews
  return SanityPreviewComponent
}
