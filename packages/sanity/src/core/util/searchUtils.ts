type SearchPathSegment = string | number | []

const GROQ_KEYWORDS = ['match', 'in', 'asc', 'desc', 'true', 'false', 'null']
const VALID_FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** @internal */
export const fieldNeedsEscape = (fieldName: string): boolean =>
  !VALID_FIELD.test(fieldName) || GROQ_KEYWORDS.includes(fieldName)

/** @internal */
export const escapeField = (fieldName: string): string => `["${fieldName}"]`

const escapeFirst = (fieldName: string): string => `@${escapeField(fieldName)}`

const isEmptyArray = (value: unknown): value is [] => Array.isArray(value) && value.length === 0

/** @internal */
export const joinPath = (pathArray: SearchPathSegment[]): string => {
  let path = ''
  for (let i = 0; i < pathArray.length; i++) {
    const pathSegment = pathArray[i]
    if (isEmptyArray(pathSegment)) {
      path += `[]`
      continue
    }

    if (typeof pathSegment === 'number') {
      path += `[${pathSegment}]`
      continue
    }

    const isFirst = i === 0
    const needsEscape = fieldNeedsEscape(pathSegment)

    if (needsEscape) {
      path = isFirst ? escapeFirst(pathSegment) : `${path}${escapeField(pathSegment)}`
    } else {
      path = isFirst ? pathSegment : `${path}.${pathSegment}`
    }
  }

  return path
}
