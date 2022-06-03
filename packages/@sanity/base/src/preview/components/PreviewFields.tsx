import {SchemaType, PreviewValue, SanityDocumentLike} from '@sanity/types'
import React from 'react'
import {PreviewSubscriber} from './PreviewSubscriber'

export interface PreviewFieldsProps {
  children: (snapshot: PreviewValue | SanityDocumentLike) => React.ReactNode
  value: SanityDocumentLike
  schemaType: SchemaType
}

export function PreviewFields(props: PreviewFieldsProps) {
  const {children, schemaType, value} = props

  return (
    <PreviewSubscriber value={value} schemaType={schemaType}>
      {({snapshot}) => <>{snapshot ? children(snapshot) : null}</>}
    </PreviewSubscriber>
  )
}
