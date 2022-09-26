import {SchemaType} from '@sanity/types'
import {ElementType} from 'react'
import {PreviewProps} from '../../components/previews'
import {SanityDefaultPreview} from './SanityDefaultPreview'

type PreviewElementType = ElementType<
  PreviewProps & {
    icon?: React.ElementType
    schemaType?: SchemaType
  }
>

export function _resolvePreviewComponent(type: SchemaType): PreviewElementType {
  // @todo: find out why `type.components?.preview` isn't inferred as `PreviewElementType`
  return (type.components?.preview as any) || SanityDefaultPreview
}
