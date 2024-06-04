import {type ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

export function getSchemaTypeIcon<TSchemaType extends ArraySchemaType>(
  schemaType: TSchemaType['of'][number],
): ComponentType | undefined {
  // Use reference icon if reference is to one schemaType only
  const referenceIcon =
    isReferenceSchemaType(schemaType) && (schemaType.to ?? []).length === 1
      ? schemaType.to[0].icon
      : undefined

  return schemaType.icon ?? schemaType.type?.icon ?? referenceIcon
}
