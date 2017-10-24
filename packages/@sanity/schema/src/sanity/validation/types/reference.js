import {error, HELP_IDS} from '../createValidationResult'
import {flatten, isObject} from 'lodash'
import {getDupes} from '../utils/getDupes'

function normalizeToProp(typeDef) {
  if (Array.isArray(typeDef.to)) {
    return typeDef.to
  }
  return typeDef.to ? [typeDef.to] : typeDef.to
}
export default (typeDef, visitorContext) => {

  const to = normalizeToProp(typeDef)
  const toIsArray = Array.isArray(to)

  const problems = flatten([
    toIsArray
      ? getDupes(to, t => `${t.name};${t.type}`).map(dupes =>
        error(
          `Found ${dupes.length} members with same type, but not unique names "${dupes[0]
            .type}" in reference. This makes it impossible to tell their values apart and you should consider naming them`,
          HELP_IDS.REFERENCE_TO_INVALID
        ))
      : error(
        'The reference type is missing or having an invalid value for the required "to" property',
        HELP_IDS.REFERENCE_TO_INVALID
      )
  ])

  return {
    ...typeDef,
    to: to.map(visitorContext.visit),
    _problems: problems
  }
}
