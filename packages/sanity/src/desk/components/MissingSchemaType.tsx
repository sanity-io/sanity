import {WarningOutlineIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import React from 'react'
import {GeneralPreviewLayoutKey, SanityDefaultPreview} from 'sanity'

export interface MissingSchemaTypeProps {
  layout?: GeneralPreviewLayoutKey
  value: SanityDocument
}

const getUnknownTypeFallback = (id: string, typeName: string) => ({
  title: (
    <em>
      No schema found for type <code>{typeName}</code>
    </em>
  ),
  subtitle: (
    <em>
      Document: <code>{id}</code>
    </em>
  ),
  media: () => <WarningOutlineIcon />,
})

export function MissingSchemaType(props: MissingSchemaTypeProps) {
  const {layout, value} = props

  return (
    <SanityDefaultPreview {...getUnknownTypeFallback(value._id, value._type)} layout={layout} />
  )
}
