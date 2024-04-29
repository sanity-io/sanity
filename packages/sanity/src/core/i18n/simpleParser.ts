/**
 * @internal
 * @hidden
 */
export type OpenTagToken = {
  type: 'tagOpen'
  name: string
  selfClosing?: boolean
}

/**
 * @internal
 * @hidden
 */
export type CloseTagToken = {
  type: 'tagClose'
  name: string
}

/**
 * @internal
 * @hidden
 */
export type TextToken = {
  type: 'text'
  text: string
}

/**
 * @internal
 * @hidden
 */
export type InterpolationToken = {
  type: 'interpolation'
  variable: string
  formatters?: string[]
}

/**
 * @internal
 * @hidden
 */
export type Token = OpenTagToken | CloseTagToken | TextToken | InterpolationToken

const OPEN_TAG_RE = /^<(?<tag>[^\s\d<][^/?><]+)\/?>/
const CLOSE_TAG_RE = /<\/(?<tag>[^>]+)>/
const SELF_CLOSING_RE = /<[^>]+\/>/
const VALID_COMPONENT_NAME_RE = /^[A-Z][A-Za-z0-9]+$/
const VALID_HTML_TAG_NAME_RE = /^[a-z]+$/
const TEMPLATE_RE = /{{\s*?([^}]+)\s*?}}/g

/**
 * Parses a string for simple tags
 *
 * @param input - input string to parse
 * @returns An array of tokens
 * @internal
 * @hidden
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
        validateTagName(tagName)
        if (text) {
          tokens.push(...textTokenWithInterpolation(text))
          text = ''
        }
        if (isSelfClosing(match[0])) {
          tokens.push({type: 'tagOpen', selfClosing: true, name: tagName})
        } else {
          tokens.push({type: 'tagOpen', name: tagName})
          openTag = tagName
        }
        remainder = remainder.slice(match[0].length)
      } else {
        // move on to next char
        text += remainder[0]
        remainder = remainder.slice(1)
      }
    } else if (openTag && remainder[0] === '<' && remainder[1] !== '<') {
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
          tokens.push(...textTokenWithInterpolation(text))
          text = ''
        }
        tokens.push({type: 'tagClose', name: tagName})
        openTag = ''
        remainder = remainder.slice(match[0].length)
      } else {
        // move on to next char
        text += remainder[0]
        remainder = remainder.slice(1)
      }
    } else {
      // move on to next char
      text += remainder[0]
      remainder = remainder.slice(1)
    }
  }
  if (openTag) {
    throw new Error(
      `No matching closing tag for <${openTag}> found. Either make it self closing (e.g. "<${openTag}/>") or close it (e.g "<${openTag}>...</${openTag}>").`,
    )
  }
  if (text) {
    tokens.push(...textTokenWithInterpolation(text))
  }
  return tokens
}

function textTokenWithInterpolation(text: string): Token[] {
  const tokens: Token[] = []

  const interpolations = text.matchAll(TEMPLATE_RE)
  let lastIndex = 0
  for (const match of interpolations) {
    if (typeof match.index === 'undefined') {
      continue
    }

    const pre = text.slice(lastIndex, match.index)
    if (pre.length > 0) {
      tokens.push({type: 'text', text: pre})
    }

    tokens.push(parseInterpolation(match[0]))

    lastIndex += pre.length + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push({type: 'text', text: text.slice(lastIndex)})
  }

  return tokens
}

function parseInterpolation(interpolation: string): InterpolationToken {
  const [variable, ...formatters] = interpolation
    .replace(/^\{\{|\}\}$/g, '')
    .trim()
    .split(/\s*,\s*/)

  // To save us from reimplementing all of i18next's formatter logic, we only curently support the
  // `list` formatter, and only without any arguments. This may change in the future, but deeming
  // this good enough for now.
  if (formatters.length === 1 && formatters[0] === 'list') {
    return {type: 'interpolation', variable, formatters}
  }

  if (formatters.length > 0) {
    throw new Error(
      `Interpolations with formatters are not supported when using <Translate>. Found "${interpolation}". Utilize "useTranslation" instead, or format the values passed to <Translate> ahead of time.`,
    )
  }

  return {type: 'interpolation', variable}
}

function isSelfClosing(tag: string) {
  return SELF_CLOSING_RE.test(tag)
}
function matchOpenTag(input: string) {
  return input.match(OPEN_TAG_RE)
}
function matchCloseTag(input: string) {
  return input.match(CLOSE_TAG_RE)
}

function validateTagName(tagName: string) {
  const isValidComponentName = VALID_COMPONENT_NAME_RE.test(tagName)
  if (isValidComponentName) {
    return
  }

  const isValidHtmlTagName = VALID_HTML_TAG_NAME_RE.test(tagName)
  if (isValidHtmlTagName) {
    return
  }

  throw new Error(
    tagName.trim() === tagName
      ? `Invalid tag "<${tagName}>". Tag names must be lowercase HTML tags or start with an uppercase letter and can only include letters and numbers.`
      : `Invalid tag "<${tagName}>". No whitespace allowed in tags.`,
  )
}
