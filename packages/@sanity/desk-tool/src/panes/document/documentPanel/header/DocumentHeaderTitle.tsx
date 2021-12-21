import React from 'react'
import {PreviewFields} from '@sanity/base/preview'
// import {SanityDocument} from '@sanity/types'
import {useDocumentPane} from '../../useDocumentPane'

const PREVIEW_FIELDS = ['title']

function renderTitle({title}: any) {
  return title ? <>{title}</> : <em>Untitled</em>
}

export function DocumentHeaderTitle() {
  const {connectionState, documentSchema, title, value} = useDocumentPane()

  if (connectionState !== 'connected') {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!value) {
    return <>New {documentSchema?.title || documentSchema?.name}</>
  }

  return (
    <PreviewFields
      document={value as any}
      layout="inline"
      type={documentSchema}
      fields={PREVIEW_FIELDS}
    >
      {renderTitle}
    </PreviewFields>
  )
}
