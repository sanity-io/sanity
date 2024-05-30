import {
  type ArraySchemaType,
  type ObjectSchemaType,
  prepareForPreview,
  type PreviewValue,
} from 'sanity'

import {getItemType} from '../../../store/utils/getItemType'

interface GetArrayItemPreviewProps {
  arrayItem: Record<string, unknown>
  arraySchemaType: ArraySchemaType
}

interface ReturnValue extends Omit<PreviewValue, 'title'> {
  title: string
}

export function getArrayItemPreview(props: GetArrayItemPreviewProps): ReturnValue {
  const {arrayItem, arraySchemaType} = props

  const itemSchemaField = getItemType(arraySchemaType, arrayItem) as ObjectSchemaType
  const preview = prepareForPreview(arrayItem, itemSchemaField)

  return {
    ...preview,
    // todo: Validate how to handle image without title. Should we fallback to _ref?
    title: preview.title || (preview.media as Record<string, any>)?._ref || 'Untitled',
  }
}
