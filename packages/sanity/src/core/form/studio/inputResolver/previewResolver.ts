import {type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

import {type PreviewProps} from '../../../components/previews/types'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'

// Kept separate from `inputResolver.tsx`: preview resolution only needs `SanityDefaultPreview`,
// while the input resolver pulls in every input component. Consumers of `usePreviewComponent`
// (e.g. `Preview`, which the input tree renders) would otherwise circularly import the whole
// form input tree.

export function defaultResolvePreviewComponent(
  schemaType: SchemaType,
): ComponentType<Omit<PreviewProps, 'renderDefault'>> {
  if (schemaType.components?.preview) return schemaType.components.preview

  return SanityDefaultPreview
}
