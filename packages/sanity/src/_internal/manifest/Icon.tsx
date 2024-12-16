import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type ComponentType, createElement, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {createDefaultIcon} from 'sanity'
import {type ServerStyleSheet, StyleSheetManager} from 'styled-components'

const theme = buildTheme()

interface SchemaIconProps {
  icon?: ComponentType | ReactNode
  title: string
  subtitle?: string
  sheet?: ServerStyleSheet
}

const SchemaIcon = ({icon, title, subtitle, sheet}: SchemaIconProps): JSX.Element => {
  return (
    <StyleSheetManager sheet={sheet?.instance}>
      <ThemeProvider theme={theme}>{normalizeIcon(icon, title, subtitle)}</ThemeProvider>
    </StyleSheetManager>
  )
}

function normalizeIcon(
  icon: ComponentType | ReactNode | undefined,
  title: string,
  subtitle = '',
): JSX.Element {
  if (isValidElementType(icon)) return createElement(icon)
  if (isValidElement(icon)) return icon
  return createDefaultIcon(title, subtitle)
}

export {SchemaIcon}
export type {SchemaIconProps}
