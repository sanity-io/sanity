import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type ComponentType, createElement, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {createDefaultIcon} from 'sanity'

const theme = buildTheme()

interface SchemaIconProps {
  icon?: ComponentType | ReactNode
  title: string
  subtitle?: string
}

const SchemaIcon = ({icon, title, subtitle}: SchemaIconProps): JSX.Element => {
  return <ThemeProvider theme={theme}>{normalizeIcon(icon, title, subtitle)}</ThemeProvider>
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
