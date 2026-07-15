import {type ReferenceSchemaType, type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

/** @internal */
export function getSchemaTypeIcon(schemaType: SchemaType): ComponentType | undefined {
  // Use reference icon if reference is to one schemaType only
  const referenceIcon =
    isReferenceSchemaType(schemaType) && (schemaType.to ?? []).length === 1
      ? schemaType.to[0]!.icon
      : undefined

  return schemaType.icon ?? schemaType.type?.icon ?? referenceIcon
}

function isReferenceSchemaType(type: unknown): type is ReferenceSchemaType {
  return isRecord(type) && (type['name'] === 'reference' || isReferenceSchemaType(type['type']))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}
