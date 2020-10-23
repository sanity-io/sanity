import * as React from 'react'
import schema from 'part:@sanity/base/schema'
import {PreviewFields} from 'part:@sanity/base/preview'
import {Doc} from '../../types'

export function DocumentHeaderTitle({
  documentType,
  paneTitle,
  value,
}: {
  documentType: string
  paneTitle?: string
  value: Doc | null
}) {
  const type = schema.get(documentType)

  if (paneTitle) {
    return <span>{paneTitle}</span>
  }

  if (!value) {
    return <>New {type.title || type.name}</>
  }

  return (
    <PreviewFields document={value} type={type} fields={['title']}>
      {({title}) => (title ? <span>{title}</span> : <em>Untitled</em>)}
    </PreviewFields>
  )
}

DocumentHeaderTitle.defaultProps = {paneTitle: undefined}
