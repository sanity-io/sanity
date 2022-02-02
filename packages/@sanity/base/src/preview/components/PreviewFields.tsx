import {SchemaType} from '@sanity/types'
import React from 'react'
import PreviewSubscriber from './PreviewSubscriber'

interface PreviewFieldsProps {
  document: Document
  type: SchemaType
  children: (snapshot: Document) => React.ReactChildren
}

export default function PreviewFields(props: PreviewFieldsProps) {
  return (
    <PreviewSubscriber value={props.document} type={props.type}>
      {({snapshot}) => <>{snapshot ? props.children(snapshot) : null}</>}
    </PreviewSubscriber>
  )
}
