import {SanityDocument} from '@sanity/types'
import React from 'react'
import schema from 'part:@sanity/base/schema'
import {PreviewFields} from 'part:@sanity/base/preview'

export interface DocTitleProps {
  document: SanityDocument
}

function ShowTitle({title}: {title?: string}) {
  return <span>{title}</span>
}

export default function DocTitle(props: DocTitleProps) {
  const {document} = props
  const type = schema.get(document._type)

  return (
    <PreviewFields document={document} type={type} fields={['title']}>
      {ShowTitle}
    </PreviewFields>
  )
}
