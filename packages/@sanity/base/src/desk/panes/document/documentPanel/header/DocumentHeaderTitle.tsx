import React from 'react'
import {SanityDocument} from '@sanity/types'
import {PreviewFields} from '../../../../../preview'
import {useDocumentPane} from '../../useDocumentPane'

function renderTitle({title}: Partial<SanityDocument>) {
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
    <PreviewFields document={value} type={documentSchema}>
      {renderTitle}
    </PreviewFields>
  )
}
