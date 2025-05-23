import {type SchemaType as SanitySchemaType} from '@sanity/types'
import {type ThemeContextValue, ThemeProvider} from '@sanity/ui'
import {type FunctionComponent, isValidElement} from 'react'

export const SchemaIcon: FunctionComponent<{
  schemaType: SanitySchemaType
  theme: ThemeContextValue
}> = function SchemaIcon({schemaType, theme: themeContext}) {
  const {theme, scheme, tone} = themeContext
  const Icon = schemaType.icon

  return Icon ? (
    <ThemeProvider theme={theme} scheme={scheme} tone={tone}>
      {isValidElement(Icon) ? Icon : <Icon />}
    </ThemeProvider>
  ) : null
}
