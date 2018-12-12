const GROQ_KEYWORDS = ['match', 'in', 'asc', 'desc', 'true', 'false', 'null']
const VALID_FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export const fieldNeedsEscape = fieldName =>
  !VALID_FIELD.test(fieldName) || GROQ_KEYWORDS.includes(fieldName)

export const escapeField = fieldName => `["${fieldName}"]`
const escapeFirst = fieldName => `@${escapeField(fieldName)}`

const isEmptyArray = v => Array.isArray(v) && v.length === 0
export const joinPath = pathArray =>
  pathArray.reduce((prev, pathSegment, i) => {
    if (isEmptyArray(pathSegment)) {
      return `${prev}[]`
    }
    const isFirst = i === 0
    const needsEscape = fieldNeedsEscape(pathSegment)

    if (needsEscape) {
      return isFirst ? escapeFirst(pathSegment) : `${prev}${escapeField(pathSegment)}`
    }
    return isFirst ? pathSegment : `${prev}.${pathSegment}`
  }, '')

// eslint-disable-next-line no-useless-escape
const FILTER_RE = /[\[|(]([^\]]+)[\]|)]/g

export function parseQuery(str) {
  const filters = []
  let termsStr = str

  let match
  while ((match = FILTER_RE.exec(str))) {
    filters.push(match[1])
    termsStr = termsStr.replace(match[0], '')
  }

  const terms = termsStr.split(/\s+/g).filter(Boolean)

  return {
    filters,
    terms
  }
}
