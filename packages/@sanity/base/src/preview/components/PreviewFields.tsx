import {SanityDocument} from '@sanity/types'
import React from 'react'
import {Type} from '../types'
import PreviewSubscriber from './PreviewSubscriber'

function toArray<T>(val: T | T[]) {
  if (Array.isArray(val)) {
    return val
  }

  return typeof val === undefined ? [] : [val]
}

interface PreviewFieldsProps {
  document: SanityDocument
  fields: string | string[]
  layout?: 'inline' | 'block' | 'default' | 'card' | 'media'
  type: Type
  children: (snapshot: SanityDocument) => React.ReactElement
}

export default function PreviewFields(props: PreviewFieldsProps) {
  const {children, document, fields, layout, type} = props

  return (
    <PreviewSubscriber layout={layout} value={document} type={type} fields={toArray(fields)}>
      {({snapshot}) => (snapshot ? children(snapshot) : null)}
    </PreviewSubscriber>
  )
}
