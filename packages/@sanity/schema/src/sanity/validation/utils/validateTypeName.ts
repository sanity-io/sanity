import humanize from 'humanize-list'
import leven from 'leven'

import {error, HELP_IDS} from '../createValidationResult'

const quote = (str: any) => `"${str}"`

export function validateTypeName(typeName: string, visitorContext: any) {
  const possibleTypeNames = visitorContext.getTypeNames()

  if (!typeName) {
    return [error(`Type is missing a type.`, HELP_IDS.TYPE_MISSING_TYPE)]
  }

  if (typeof typeName !== 'string') {
    return [
      error(
        `Type has an invalid "type"-property - should be a string.`,
        HELP_IDS.TYPE_MISSING_TYPE,
      ),
    ]
  }

  const isValid = possibleTypeNames.includes(typeName)

  if (!isValid) {
    const suggestions = possibleTypeNames
      .map((possibleTypeName: any) => {
        return [leven(typeName, possibleTypeName), possibleTypeName]
      })
      .filter(([distance]: any) => distance < 3)
      .map(([_, name]: any) => name)

    const suggestion =
      suggestions.length > 0
        ? ` Did you mean ${humanize(suggestions.map(quote), {conjunction: 'or'})}?`
        : ''

    return [error(`Unknown type: ${typeName}.${suggestion}`)]
  }
  return []
}
