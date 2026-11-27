import {type ReactElement, type ReactNode, Fragment, isValidElement} from 'react'

let renderToString: ((element: ReactElement) => string) | undefined
let rendererLoaded: Promise<void> | undefined

/**
 * Loads `react-dom/server`, which only a title that contains a React component needs: a title of
 * HTML elements is read without rendering it. The promise is created once, so `use()` can read it
 * on every render.
 */
export function loadComponentTitleRenderer(): Promise<void> {
  rendererLoaded ??= loadRenderer()
  return rendererLoaded
}

async function loadRenderer() {
  const module = await import('./renderToString.lazy')
  renderToString = module.default
}

/**
 * The text of a title made of HTML elements, strings and numbers, which is what rendering it and
 * reading the result's text gives. `undefined` when only rendering can tell: a component, or an
 * element whose markup is not its children.
 */
function textOfHtmlElements(node: ReactNode): string | undefined {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    return String(node)
  }
  if (Array.isArray(node)) {
    let text = ''
    for (const child of node) {
      const childText = textOfHtmlElements(child)
      if (childText === undefined) return undefined
      text += childText
    }
    return text
  }
  if (!isValidElement<{children?: ReactNode; dangerouslySetInnerHTML?: unknown}>(node)) {
    return undefined
  }
  const isHtmlElement = typeof node.type === 'string' && node.type !== 'textarea'
  if (!(isHtmlElement || node.type === Fragment) || node.props.dangerouslySetInnerHTML) {
    return undefined
  }
  return textOfHtmlElements(node.props.children)
}

/**
 * Whether a title is a React element that only `react-dom/server` can turn into text. A schema
 * with such a title has to load it (`loadComponentTitleRenderer`) before its search field
 * definitions are created.
 */
export function isComponentTitle(title: unknown): boolean {
  return isValidElement(title) && textOfHtmlElements(title) === undefined
}

/**
 * Convert a field value to a string (if it's a React element) and remove HTML tags.
 * If the field value is a string, pass through as-is.
 */
export function sanitizeFieldValue(name: string | React.JSX.Element): string {
  if (isValidElement(name)) {
    const text = textOfHtmlElements(name)
    if (text !== undefined) return text
    if (!renderToString) {
      void loadComponentTitleRenderer()
      return ''
    }
    try {
      return stripHtmlTags(renderToString(name))
    } catch (err) {
      console.warn(
        'A field title or description contains a React component that could not be rendered. ' +
          'This is likely caused by a component that requires runtime context. ' +
          'Use a string or JSX containing HTML elements only.',
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
