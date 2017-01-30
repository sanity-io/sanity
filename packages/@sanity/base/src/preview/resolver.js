import customResolver from 'part:@sanity/base/preview-resolver?'
import SanityPreview from './SanityPreview'

export default function previewResolver(type) {
  const custom = customResolver && customResolver(type)
  if (custom) {
    return custom
  }

  // todo: consider?
  // if (type.previewComponent) {
  //   return type.previewComponent
  // }

  return SanityPreview
}
