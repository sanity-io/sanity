import {SchemaType, SanityDocument} from '@sanity/types'
import React from 'react'
import {PreviewSubscriber} from './PreviewSubscriber'

interface PreviewFieldsProps {
  document: Partial<SanityDocument>
  type: SchemaType
  children: (snapshot: Partial<SanityDocument>) => React.ReactNode
}

export function PreviewFields(props: PreviewFieldsProps) {
  return (
    <PreviewSubscriber value={props.document} type={props.type}>
      {({snapshot}) => <>{snapshot ? props.children(snapshot) : null}</>}
    </PreviewSubscriber>
  )
}
