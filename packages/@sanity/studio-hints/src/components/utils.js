/* eslint-disable import/prefer-default-export */
const resolveSegment = {
  guide: 'guides',
  article: 'docs'
}

export const resolveUrl = doc => {
  return `https://sanity.io/${resolveSegment[doc._type]}/${doc.slug.current}`
}
