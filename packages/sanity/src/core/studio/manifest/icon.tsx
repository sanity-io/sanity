import {ThemeProvider} from '@sanity/ui'
import {type RootTheme} from '@sanity/ui/theme'
import {type ComponentType, isValidElement, type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {isValidElementType} from 'react-is'

import {createDefaultIcon} from '../../config/createDefaultIcon'

interface IconProps {
  icon?: ComponentType | ReactNode
  title: string
  subtitle?: string
  theme: RootTheme
}

/**
 * Normalizes icon input to a React element.
 */
function normalizeIcon(
  Icon: ComponentType | ReactNode | undefined,
  title: string,
  subtitle = '',
): React.JSX.Element {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return createDefaultIcon(title, subtitle)
}

/**
 * Renders a workspace icon to an HTML string.
 *
 * Sanitization is intentionally omitted here — the backend sanitizes
 * icon HTML when the manifest is posted to the API.
 */
export const resolveIcon = (props: IconProps): string | undefined => {
  try {
    const iconElement = normalizeIcon(props.icon, props.title, props.subtitle)
    const wrappedElement = <ThemeProvider theme={props.theme}>{iconElement}</ThemeProvider>
    return renderToStaticMarkup(wrappedElement).trim() || undefined
  } catch {
    return undefined
  }
}
