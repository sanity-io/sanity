import {type SchemaType as SanitySchemaType} from '@sanity/types'
import {isValidElement} from 'react'

export function SchemaIcon({schemaType}: {schemaType: SanitySchemaType}): React.JSX.Element | null {
  const Icon = schemaType.icon

  return Icon ? isValidElement(Icon) ? Icon : <Icon /> : null
}
