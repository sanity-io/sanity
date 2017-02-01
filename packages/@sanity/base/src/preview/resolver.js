import customResolver from 'part:@sanity/base/preview-resolver?'
import SanityPreview from './SanityPreview'
import ReferencePreview from './ReferencePreview'

export default function previewResolver(type) {
  const custom = customResolver && customResolver(type)
  if (custom) {
    return custom
  }

  if (type.name === 'reference') {
    return ReferencePreview
  }

  // todo: consider?
  // if (type.previewComponent) {
  //   return type.previewComponent
  // }

  return SanityPreview
}
