import {SchemaType} from '@sanity/types'
import React from 'react'
import {PreviewProps} from '../../components/previews'
import {SanityDefaultPreview} from './SanityDefaultPreview'

type PreviewElementType = React.ElementType<
  PreviewProps & {
    icon?: React.ElementType
    schemaType?: SchemaType
  }
>

export function _resolvePreviewComponent(type: SchemaType): PreviewElementType {
  return (type.components?.preview as PreviewElementType) || SanityDefaultPreview
}
