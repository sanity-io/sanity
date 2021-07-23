import React from 'react'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import WarningIcon from 'part:@sanity/base/warning-icon'

export interface MissingSchemaTypeProps {
  layout?: 'inline' | 'block' | 'default' | 'card' | 'media'
  value: Record<string, any>
}

const getUnknownTypeFallback = (id: string, typeName: string) => ({
  title: (
    <span style={{fontStyle: 'italic'}}>
      No schema found for type &quot;
      {typeName}
      &quot;
    </span>
  ),
  subtitle: <span style={{fontStyle: 'italic'}}>Document: {id}</span>,
  media: WarningIcon,
})

export default function MissingSchemaType(props: MissingSchemaTypeProps) {
  const {layout, value} = props

  return (
    <SanityDefaultPreview value={getUnknownTypeFallback(value._id, value._type)} layout={layout} />
  )
}
