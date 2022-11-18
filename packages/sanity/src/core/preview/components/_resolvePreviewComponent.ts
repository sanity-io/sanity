import {SchemaType} from '@sanity/types'
import {ComponentType} from 'react'
import {PreviewProps} from '../../components'
import {SanityDefaultPreview} from './SanityDefaultPreview'

export function _resolvePreviewComponent(
  type: SchemaType
): ComponentType<Omit<PreviewProps, 'renderDefault'>> {
  return type.components?.preview || SanityDefaultPreview
}
