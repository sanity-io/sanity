export type OpenTagToken = {
  type: 'tagOpen'
  name: string
  selfClosing?: boolean
}
export type CloseTagToken = {
  type: 'tagClose'
  name: string
}
export type TextToken = {
  type: 'text'
  text: string
}
export type Token = OpenTagToken | CloseTagToken | TextToken

const OPEN_TAG_RE = /<(?<tag>\w+)\/?>/
const CLOSE_TAG_RE = /<\/(?<tag>\w+)>/
const SELF_CLOSING_RE = /<\w+\/>/

function isSelfClosing(tag: string) {
  return SELF_CLOSING_RE.test(tag)
}
function matchOpenTag(input: string) {
  return input.match(OPEN_TAG_RE)
}
function matchCloseTag(input: string) {
  return input.match(CLOSE_TAG_RE)
}

/**
 * Parses a string for simple tags
 * @param input - input string to parse
 */
export function simpleParser(input: string): Token[] {
  const tokens: Token[] = []
  let text = ''
  let openTag = ''
  let remainder = input
  while (remainder.length > 0) {
    if (!openTag && remainder[0] === '<') {
      const match = matchOpenTag(remainder)
      if (match) {
        const tagName = match.groups!.tag
        if (text) {
          tokens.push({type: 'text', text})
          text = ''
        }
        if (isSelfClosing(match[0])) {
          tokens.push({type: 'tagOpen', selfClosing: true, name: tagName})
        } else {
          tokens.push({type: 'tagOpen', name: tagName})
          openTag = tagName
        }
        remainder = remainder.substring(match[0].length)
      } else {
        // move on to next char
        text += remainder[0]
        remainder = remainder.substring(1)
      }
    } else if (openTag && remainder[0] === '<') {
      const match = matchCloseTag(remainder)
      if (match) {
        if (remainder[1] !== '/') {
          throw new Error('Expected closing tag')
        }
        const tagName = match.groups!.tag
        if (tagName !== openTag) {
          throw new Error(`Unbalanced tag: expected a closing tag for ${openTag}`)
        }
        if (text) {
          tokens.push({type: 'text', text})
          text = ''
        }
        tokens.push({type: 'tagClose', name: tagName})
        openTag = ''
        remainder = remainder.substring(match[0].length)
      } else {
        // move on to next char
        text += remainder[0]
        remainder = remainder.substring(1)
      }
    } else {
      // move on to next char
      text += remainder[0]
      remainder = remainder.substring(1)
    }
  }
  if (text) {
    tokens.push({type: 'text', text})
  }
  return tokens
}
