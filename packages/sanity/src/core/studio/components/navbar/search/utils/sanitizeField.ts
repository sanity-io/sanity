import {isValidElement, type ReactNode} from 'react'
import {renderToString} from 'react-dom/server'

/**
 * Convert a field value to a string (if it's a React element) and remove HTML tags.
 */
export function sanitizeFieldValue(name: string | React.JSX.Element): string {
  if (isValidElement<{children?: ReactNode}>(name)) {
    try {
      return stripHtmlTags(renderToString(name))
    } catch {
      /**
       * If rendering fails due to missing runtime context (eg IntentLink/useRouter),
       * fall back to statically extracting children text.
       */
      return extractNodeText(name.props.children).replace(/\s+/g, ' ').trim()
    }
  }

  return typeof name === 'string' ? name : ''
}

function stripHtmlTags(str: string) {
  return new DOMParser().parseFromString(str, 'text/html')?.body.textContent || ''
}

function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => sanitizeFieldValue(child)).join('')
  }

  if (isValidElement<{children?: ReactNode}>(node)) {
    return sanitizeFieldValue(node)
  }

  return ''
}
