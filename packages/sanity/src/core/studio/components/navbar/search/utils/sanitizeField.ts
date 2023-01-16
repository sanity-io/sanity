import {isValidElement, ReactElement} from 'react'
import {renderToString} from 'react-dom/server'

/**
 * Convert a field value to a string (if it's a React element) and remove HTML tags.
 * If the field value is a string, pass through as-is.
 */
export function sanitizeFieldValue(name: string | ReactElement): string {
  if (isValidElement(name)) {
    return stripHtmlTags(renderToString(name))
  }
  return name
}

function stripHtmlTags(str: string) {
  return new DOMParser().parseFromString(str, 'text/html')?.body.textContent || ''
}
