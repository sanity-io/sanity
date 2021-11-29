// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {WarningOutlineIcon} from '@sanity/icons'
import type {SanityDocument} from '@sanity/types'
import React from 'react'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'

export interface MissingSchemaTypeProps {
  layout?: 'inline' | 'block' | 'default' | 'card' | 'media'
  value: SanityDocument
}

const getUnknownTypeFallback = (id: string, typeName: string): Partial<SanityDocument> => ({
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
  media: WarningOutlineIcon,
})

export function MissingSchemaType(props: MissingSchemaTypeProps) {
  const {layout, value} = props

  return (
    <SanityDefaultPreview value={getUnknownTypeFallback(value._id, value._type)} layout={layout} />
  )
}
