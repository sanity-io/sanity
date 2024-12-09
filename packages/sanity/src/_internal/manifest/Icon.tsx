import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {createElement, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {ServerStyleSheet, StyleSheetManager} from 'styled-components'

import {type Tool, type Workspace} from '../../core'
import {createDefaultIcon} from '../../core/config/createDefaultIcon'

export interface SchemaIconProps {
  icon: Tool['icon'] | Workspace['icon']
  title: string
  subtitle?: string
}

const theme = buildTheme()

export const SchemaIcon = ({icon, title, subtitle}: SchemaIconProps): JSX.Element => {
  const sheet = new ServerStyleSheet()

  return (
    <StyleSheetManager sheet={sheet.instance}>
      <ThemeProvider theme={theme}>{normalizeIcon(icon, title, subtitle)}</ThemeProvider>
    </StyleSheetManager>
  )
}

function normalizeIcon(
  icon: Tool['icon'] | Workspace['icon'] | undefined,
  title: string,
  subtitle = '',
): JSX.Element {
  if (isValidElementType(icon)) return createElement(icon)
  if (isValidElement(icon)) return icon
  return createDefaultIcon(title, subtitle)
}
