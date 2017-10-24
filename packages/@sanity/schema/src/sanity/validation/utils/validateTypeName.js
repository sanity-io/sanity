import leven from 'leven'
import humanize from 'humanize-list'
import {error} from '../createValidationResult'

const quote = str => `"${str}"`

export function validateTypeName(typeName: string, visitorContext) {
  const possibleTypeNames = visitorContext.getTypeNames()

  if (!typeName) {
    return [
      error(`Missing type name. Valid types are: ${humanize(possibleTypeNames)}`,
        'schema-type-invalid-or-missing-attr-type')
    ]
  }

  const isValid = possibleTypeNames.includes(typeName)

  if (!isValid) {
    const suggestions = possibleTypeNames
      .map(possibleTypeName => {
        if (!possibleTypeName || !typeName) {

        }
        return [leven(typeName, possibleTypeName), possibleTypeName]
      })
      .filter(([distance]) => distance < 3)
      .map(([_, name]) => name)

    const suggestion = suggestions.length > 0 ? ` Did you mean ${humanize(suggestions.map(quote), {conjunction: 'or'})}?` : ''

    return [
      error(
        `Invalid type: ${typeName}.${suggestion} Valid types are: ${humanize(possibleTypeNames)}`,
        'schema-type-invalid-or-missing-attr-type'
      )
    ]
  }
  return []
}
