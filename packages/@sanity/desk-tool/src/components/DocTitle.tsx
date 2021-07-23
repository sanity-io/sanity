import {SanityDocument} from '@sanity/types'
import React from 'react'
import schema from 'part:@sanity/base/schema'
import {PreviewFields} from 'part:@sanity/base/preview'

export interface DocTitleProps {
  document: SanityDocument
}

const renderTitle = ({title}: {title?: string}) => <span>{title}</span>

export function DocTitle(props: DocTitleProps) {
  const {document} = props
  const type = schema.get(document._type)

  return (
    <PreviewFields document={document} type={type} fields={['title']}>
      {renderTitle}
    </PreviewFields>
  )
}
