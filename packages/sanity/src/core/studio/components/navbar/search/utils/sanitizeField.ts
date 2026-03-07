import {isValidElement} from 'react'
import {renderToString} from 'react-dom/server'

/**
 * Convert a field value to a string (if it's a React element) and remove HTML tags.
 */
export function sanitizeFieldValue(name: string | React.JSX.Element): string {
  if (isValidElement(name)) {
    try {
      return stripHtmlTags(renderToString(name))
    } catch (err) {
      console.warn(
        'A field title or description contains a React component that could not be rendered. ' +
          'This is likely caused by a component that requires runtime context. ' +
          'Use a plain string or plain HTML instead.',
        err,
      )
      return ''
    }
  }

  return typeof name === 'string' ? name : ''
}

function stripHtmlTags(str: string) {
  return new DOMParser().parseFromString(str, 'text/html')?.body.textContent || ''
}
