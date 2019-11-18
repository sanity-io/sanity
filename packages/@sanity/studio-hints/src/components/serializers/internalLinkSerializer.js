/* eslint-disable react/prop-types */
import React from 'react'
import Link from 'next/link'

const resolveContentType = {
  post: 'blog',
  remoteArticle: 'docs',
  article: 'docs',
  schemaType: 'docs',
  guide: 'guide',
  chapter: 'docs',
  docsOverview: 'docs'
}

const internalLinkSerializer = props => {
  const {mark = {}, children} = props
  const {type, slug = {}} = mark
  const segment = resolveContentType[type]

  if (!type) {
    // eslint-disable-next-line no-console
    console.error(`Missing type on internalLink`, mark)
    return children
  }

  const href = segment ? `/${segment}/${slug.current}` : `/${slug.current}`

  return (
    <a href={`https://www.sanity.io${href}`} target="_blank" rel="noopener">
      {children}
    </a>
  )
}

export default internalLinkSerializer
