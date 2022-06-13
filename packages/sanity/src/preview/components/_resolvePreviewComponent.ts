import {SchemaType} from '@sanity/types'
import {ComponentType} from 'react'
import {PreviewProps} from '../../components/previews'
import {SanityDefaultPreview} from './SanityDefaultPreview'

export function _resolvePreviewComponent(type: SchemaType): ComponentType<
  PreviewProps & {
    icon?: ComponentType
    schemaType?: SchemaType
  }
> {
  return type.components?.preview || SanityDefaultPreview
}
