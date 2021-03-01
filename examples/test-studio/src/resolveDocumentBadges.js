import defaultResolve from 'part:@sanity/base/document-badges'

function CustomBadge() {
  return {
    label: 'Hello World',
    title: 'Hello I am a custom document badge',
    color: 'success',
  }
}

export default function resolveDocumentBadges(props) {
  return [...defaultResolve(props), CustomBadge]
}
