import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type ComponentType, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {createDefaultIcon} from 'sanity'

const theme = buildTheme()

interface SchemaIconProps {
  icon?: ComponentType | ReactNode
  title: string
  subtitle?: string
}

const SchemaIcon = ({icon, title, subtitle}: SchemaIconProps): React.JSX.Element => {
  return <ThemeProvider theme={theme}>{normalizeIcon(icon, title, subtitle)}</ThemeProvider>
}

function normalizeIcon(
  Icon: ComponentType | ReactNode | undefined,
  title: string,
  subtitle = '',
): React.JSX.Element {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return createDefaultIcon(title, subtitle)
}

export {SchemaIcon}
export type {SchemaIconProps}
