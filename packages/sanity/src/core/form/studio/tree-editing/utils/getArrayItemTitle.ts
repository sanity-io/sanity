import {type ArraySchemaType, getSchemaTypeTitle, type ObjectSchemaType} from 'sanity'

interface GetArrayItemTitleProps {
  arrayItem: Record<string, unknown>
  arraySchemaType: ArraySchemaType
}

export function getArrayItemTitle(props: GetArrayItemTitleProps) {
  const {arrayItem, arraySchemaType} = props

  const itemType = arrayItem?._type as string

  const itemSchemaField = arraySchemaType?.of?.find(
    (type) => type.name === itemType,
  ) as ObjectSchemaType

  let title = getSchemaTypeTitle(itemSchemaField)

  const previewTitleKey = itemSchemaField?.preview?.select?.title || ''
  const itemTitle = arrayItem?.[previewTitleKey]

  if (itemSchemaField?.type?.name === 'image') {
    title = (arrayItem?.asset as any)?._ref
  }

  if (typeof itemTitle === 'string') {
    title = itemTitle
  }

  return String(title || 'Untitled')
}
