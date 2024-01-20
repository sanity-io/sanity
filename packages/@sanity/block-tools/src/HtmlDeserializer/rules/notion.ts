import {type ArraySchemaType} from '@sanity/types'

import {DEFAULT_SPAN, HTML_BLOCK_TAGS, HTML_HEADER_TAGS} from '../../constants'
import {type DeserializerRule} from '../../types'
import {isElement, tagName} from '../helpers'

// font-style:italic seems like the most important rule for italic / emphasis in their html
function isEmphasis(el: Node): boolean {
  const style = isElement(el) && el.getAttribute('style')
  return /font-style:italic/.test(style || '')
}

// font-weight:700 or 600 seems like the most important rule for bold in their html
function isStrong(el: Node): boolean {
  const style = isElement(el) && el.getAttribute('style')
  return /font-weight:700/.test(style || '') || /font-weight:600/.test(style || '')
}

// text-decoration seems like the most important rule for underline in their html
function isUnderline(el: Node): boolean {
  const style = isElement(el) && el.getAttribute('style')
  return /text-decoration:underline/.test(style || '')
}

// Check for attribute given by the Notion preprocessor
function isNotion(el: Node): boolean {
  return isElement(el) && Boolean(el.getAttribute('data-is-notion'))
}

const blocks: Record<string, {style: string} | undefined> = {
  ...HTML_BLOCK_TAGS,
  ...HTML_HEADER_TAGS,
}

export default function createNotionRules(_blockContentType: ArraySchemaType): DeserializerRule[] {
  return [
    {
      deserialize(el) {
        // Notion normally exports semantic HTML. However, if you copy a single block, the formatting will be inline styles
        // This handles a limited set of styles
        if (isElement(el) && tagName(el) === 'span' && isNotion(el)) {
          const span = {
            ...DEFAULT_SPAN,
            marks: [] as string[],
            text: el.textContent,
          }
          if (isStrong(el)) {
            span.marks.push('strong')
          }
          if (isUnderline(el)) {
            span.marks.push('underline')
          }
          if (isEmphasis(el)) {
            span.marks.push('em')
          }
          return span
        }
        return undefined
      },
    },
  ]
}
