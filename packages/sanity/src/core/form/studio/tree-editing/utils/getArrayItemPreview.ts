import {
  type ArraySchemaType,
  type ObjectSchemaType,
  prepareForPreview,
  type PreviewValue,
} from 'sanity'

interface GetArrayItemPreviewProps {
  arrayItem: Record<string, unknown>
  arraySchemaType: ArraySchemaType
}

interface ReturnValue extends Omit<PreviewValue, 'title'> {
  title: string
}

export function getArrayItemPreview(props: GetArrayItemPreviewProps): ReturnValue {
  const {arrayItem, arraySchemaType} = props

  const itemType = arrayItem?._type as string

  const itemSchemaField = arraySchemaType?.of?.find(
    (type) => type.name === itemType,
  ) as ObjectSchemaType

  if (!itemType) {
    return {
      title: 'Untitled',
      description: undefined,
      imageUrl: undefined,
      media: undefined,
      subtitle: undefined,
    }
  }

  const preview = prepareForPreview(arrayItem, itemSchemaField)

  return {
    ...preview,
    // todo: Validate how to handle image without title. Should we fallback to _ref?
    title: preview.title || (preview.media as Record<string, any>)?._ref || 'Untitled',
  }
}
