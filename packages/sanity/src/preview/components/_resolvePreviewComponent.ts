import {SchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ComponentType} from 'react'
import {PreviewProps} from '../../components/previews'
import {SanityDefaultPreview} from './SanityDefaultPreview'

export function _resolvePreviewComponent(type: SchemaType): ComponentType<
  PreviewProps & {
    error: Error | null
    icon?: ComponentType
    schemaType?: SchemaType
  }
> {
  const fromPreview = get(type, 'preview.component')

  if (fromPreview) {
    return fromPreview
  }

  return SanityDefaultPreview
}
