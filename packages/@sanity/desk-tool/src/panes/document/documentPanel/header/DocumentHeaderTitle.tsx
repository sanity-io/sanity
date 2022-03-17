import React from 'react'
import {PreviewFields} from '@sanity/base/preview'
import {useDocumentPane} from '../../useDocumentPane'

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
    <PreviewFields document={value as any} type={documentSchema}>
      {renderTitle}
    </PreviewFields>
  )
}
