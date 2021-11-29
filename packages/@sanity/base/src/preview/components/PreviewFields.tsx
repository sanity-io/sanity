import type {SchemaType} from '@sanity/types'
import React from 'react'
import PreviewSubscriber from './PreviewSubscriber'

function arrify<T>(val: T | T[]) {
  if (Array.isArray(val)) {
    return val
  }
  return typeof val === undefined ? [] : [val]
}

interface PreviewFieldsProps {
  document: Document
  fields: string | string[]
  type: SchemaType
  children: (snapshot: Document) => React.ReactChildren
}

export default function PreviewFields(props: PreviewFieldsProps) {
  return (
    <PreviewSubscriber value={props.document} type={props.type} fields={arrify(props.fields)}>
      {({snapshot}) => <>{snapshot ? props.children(snapshot) : null}</>}
    </PreviewSubscriber>
  )
}
