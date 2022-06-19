import leven from 'leven'
import humanize from 'humanize-list'
import {error, HELP_IDS} from '../createValidationResult'

const quote = (str) => `"${str}"`

export function validateTypeName(typeName: string, visitorContext) {
  const possibleTypeNames = visitorContext.getTypeNames()

  if (!typeName) {
    return [
      error(
        `Type is missing a type. Valid types are: ${humanize(possibleTypeNames)}`,
        HELP_IDS.TYPE_MISSING_TYPE
      ),
    ]
  }

  if (typeof typeName !== 'string') {
    return [
      error(
        `Type has an invalid "type"-property - should be a string. Valid types are: ${humanize(
          possibleTypeNames
        )}`,
        HELP_IDS.TYPE_MISSING_TYPE
      ),
    ]
  }

  const isValid = possibleTypeNames.includes(typeName)

  if (!isValid) {
    const suggestions = possibleTypeNames
      .map((possibleTypeName) => {
        return [leven(typeName, possibleTypeName), possibleTypeName]
      })
      .filter(([distance]) => distance < 3)
      .map(([_, name]) => name)

    const suggestion =
      suggestions.length > 0
        ? ` Did you mean ${humanize(suggestions.map(quote), {conjunction: 'or'})}?`
        : ''

    return [
      error(
        `Unknown type: ${typeName}.${suggestion}\n\nValid types are: ${humanize(possibleTypeNames)}`
      ),
    ]
  }
  return []
}
