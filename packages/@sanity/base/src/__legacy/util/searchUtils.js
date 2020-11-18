const GROQ_KEYWORDS = ['match', 'in', 'asc', 'desc', 'true', 'false', 'null']
const VALID_FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export const fieldNeedsEscape = (fieldName) =>
  !VALID_FIELD.test(fieldName) || GROQ_KEYWORDS.includes(fieldName)

export const escapeField = (fieldName) => `["${fieldName}"]`
const escapeFirst = (fieldName) => `@${escapeField(fieldName)}`

const isEmptyArray = (v) => Array.isArray(v) && v.length === 0
export const joinPath = (pathArray) =>
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
