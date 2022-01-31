// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SanityDocument} from '@sanity/types'
import React from 'react'
import {PreviewFields} from 'part:@sanity/base/preview'
import schema from 'part:@sanity/base/schema'

export interface DocTitleProps {
  document: Partial<Omit<SanityDocument, '_type'>> & {_type: SanityDocument['_type']}
}

const renderTitle = ({title}: SanityDocument) => {
  return <>{title || 'Untitled'}</>
}

const PREVIEW_FIELDS = ['title']

export function DocTitle(props: DocTitleProps) {
  const {document} = props
  const schemaType = schema.get(document._type)

  if (!schemaType) {
    return <>&lt;Missing type&gt;</>
  }

  return (
    <PreviewFields document={document} fields={PREVIEW_FIELDS} layout="inline" type={schemaType}>
      {renderTitle}
    </PreviewFields>
  )
}
