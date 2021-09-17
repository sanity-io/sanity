// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import schema from 'part:@sanity/base/schema'
import {PreviewFields} from 'part:@sanity/base/preview'
import {SanityDocument} from '@sanity/types'

interface DocumentHeaderTitleProps {
  documentType: string
  paneTitle?: string
  value: Partial<SanityDocument> | null
}

const PREVIEW_FIELDS = ['title']

function renderTitle({title}: SanityDocument) {
  return title ? <>{title}</> : <em>Untitled</em>
}

export function DocumentHeaderTitle(props: DocumentHeaderTitleProps) {
  const {documentType, paneTitle, value} = props
  const type = schema.get(documentType)

  if (paneTitle) {
    return <>{paneTitle}</>
  }

  if (!value) {
    return <>New {type?.title || type?.name}</>
  }

  return (
    <PreviewFields document={value} layout="inline" type={type} fields={PREVIEW_FIELDS}>
      {renderTitle}
    </PreviewFields>
  )
}
