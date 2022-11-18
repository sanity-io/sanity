import {SchemaType} from '@sanity/types'
import {ComponentType} from 'react'
import {RenderPreviewCallbackProps} from '../../form'
import {SanityDefaultPreview} from './SanityDefaultPreview'

export function _resolvePreviewComponent(
  type: SchemaType
): ComponentType<RenderPreviewCallbackProps> {
  return type.components?.preview || SanityDefaultPreview
}
