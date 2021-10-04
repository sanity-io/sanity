// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {PreviewFields} from 'part:@sanity/base/preview'
import {SanityDocument} from '@sanity/types'
import {useDocumentPane} from '../../useDocumentPane'

const PREVIEW_FIELDS = ['title']

function renderTitle({title}: SanityDocument) {
  return title ? <>{title}</> : <em>Untitled</em>
}

export function DocumentHeaderTitle() {
  const {documentSchema, title, value} = useDocumentPane()

  if (title) {
    return <>{title}</>
  }

  if (!value) {
    return <>New {documentSchema?.title || documentSchema?.name}</>
  }

  return (
    <PreviewFields document={value} layout="inline" type={documentSchema} fields={PREVIEW_FIELDS}>
      {renderTitle}
    </PreviewFields>
  )
}
