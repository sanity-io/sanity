import {error, HELP_IDS} from '../createValidationResult'
import {flatten, isPlainObject} from 'lodash'
import {getDupes} from '../utils/getDupes'

function normalizeToProp(typeDef) {
  if (Array.isArray(typeDef.to)) {
    return typeDef.to
  }
  return typeDef.to ? [typeDef.to] : typeDef.to
}

export default (typeDef, visitorContext) => {
  const isValidTo = Array.isArray(typeDef.to) || isPlainObject(typeDef.to)
  const normalizedTo = normalizeToProp(typeDef)

  const problems = flatten([
    isValidTo
      ? getDupes(normalizedTo, t => `${t.name};${t.type}`).map(dupes =>
          error(
            `Found ${dupes.length} members with same type, but not unique names "${
              dupes[0].type
            }" in reference. This makes it impossible to tell their values apart and you should consider naming them`,
            HELP_IDS.REFERENCE_TO_INVALID
          )
        )
      : error(
          'The reference type is missing or having an invalid value for the required "to" property. It should be an array of accepted types.',
          HELP_IDS.REFERENCE_TO_INVALID
        )
  ])

  if (isValidTo && normalizedTo.length === 0) {
    problems.push(
      error(
        'The reference type should define at least one accepted type. Please check the "to" property.',
        HELP_IDS.REFERENCE_TO_INVALID
      )
    )
  }

  return {
    ...typeDef,
    to: (isValidTo ? normalizedTo : []).map(visitorContext.visit),
    _problems: problems
  }
}
