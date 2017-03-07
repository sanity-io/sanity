import customResolver from 'part:@sanity/base/preview-resolver?'
import SanityDefaultPreview from './SanityDefaultPreview'
import ReferencePreview from './ReferencePreview'

export default function previewResolver(type) {
  const custom = customResolver && customResolver(type)
  if (custom) {
    return custom
  }

  return (type.name === 'reference') ? ReferencePreview : SanityDefaultPreview
}
