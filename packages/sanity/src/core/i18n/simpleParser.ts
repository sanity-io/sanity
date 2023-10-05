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

const OPEN_TAG_RE = /<(?<tag>[^\s\d][^/?><]+)\/?>/
const CLOSE_TAG_RE = /<\/(?<tag>[^>]+)>/
const SELF_CLOSING_RE = /<[^>]+\/>/
const VALID_TAG_NAME = /^[A-Z][A-Za-z0-9]+$/

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
        if (!VALID_TAG_NAME.test(tagName)) {
          throw new Error(
            tagName.trim() === tagName
              ? `Invalid tag "<${tagName}>". Tag names must start with an uppercase letter and can only include letters and numbers."`
              : `Invalid tag "<${tagName}>". No whitespace allowed in tags."`,
          )
        }
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
        const tagName = match.groups!.tag
        if (remainder[1] !== '/') {
          throw new Error(
            `Expected closing tag for <${openTag}>, but found new opening tag <${tagName}>. Nested tags is not supported.`,
          )
        }
        if (tagName !== openTag) {
          throw new Error(
            `Expected closing tag for <${openTag}>, but found closing tag </${tagName}> instead. Make sure each opening tag has a matching closing tag.`,
          )
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
  if (openTag) {
    throw new Error(
      `No matching closing tag for <${openTag}> found. Either make it self closing (e.g. "<${openTag}/>") or close it (e.g "<${openTag}>...</${openTag}>").`,
    )
  }
  if (text) {
    tokens.push({type: 'text', text})
  }
  return tokens
}
