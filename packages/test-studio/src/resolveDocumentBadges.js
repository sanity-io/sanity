import * as DefaultBadges from 'part:@sanity/base/document-badges'

function CustomBadge() {
  return {
    label: '👋 Hello',
    title: `Hello I am a custom document badge`
  }
}

export default function resolveDocumentBadges() {
  return [...Object.values(DefaultBadges), CustomBadge]
}
