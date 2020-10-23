/* eslint-disable import/prefer-default-export */
const resolveSegment = {
  guide: 'guides',
  article: 'docs',
}

export const resolveUrl = (doc, repoId) => {
  return `https://sanity.io/${resolveSegment[doc._type]}/${
    doc.slug.current
  }?utm_source=hints&utm_medium=${repoId}`
}
