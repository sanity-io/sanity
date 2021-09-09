import React from 'react'
import {SchemaType} from '@sanity/types'
import {previewResolver as resolvePreview} from '../legacyParts'

interface PreviewProps {
  layout?: string
  value?: unknown
  type: SchemaType
}

export default function Preview(props: PreviewProps) {
  const {type, value, layout} = props

  const PreviewComponent = resolvePreview(type)

  return PreviewComponent ? (
    <PreviewComponent type={type} value={value} layout={layout} />
  ) : (
    <div>No preview for {JSON.stringify(value)}</div>
  )
}
