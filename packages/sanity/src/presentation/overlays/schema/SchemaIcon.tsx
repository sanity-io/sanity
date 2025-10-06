import {type SchemaType as SanitySchemaType} from '@sanity/types'
import {type FunctionComponent, isValidElement} from 'react'

export const SchemaIcon: FunctionComponent<{
  schemaType: SanitySchemaType
}> = function SchemaIcon({schemaType}) {
  const Icon = schemaType.icon

  return Icon ? <>{isValidElement(Icon) ? Icon : <Icon />}</> : null
}
