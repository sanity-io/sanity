import {type SchemaType as SanitySchemaType} from '@sanity/types'
import {type FunctionComponent, isValidElement} from 'react'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

export const SchemaIcon: FunctionComponent<{
  schemaType: SanitySchemaType
}> = function SchemaIcon({schemaType}) {
  const sheet = new ServerStyleSheet()
  const Icon = schemaType.icon

  return Icon ? (
    <StyleSheetManager sheet={sheet.instance}>
      {isValidElement(Icon) ? Icon : <Icon />}
    </StyleSheetManager>
  ) : null
}
