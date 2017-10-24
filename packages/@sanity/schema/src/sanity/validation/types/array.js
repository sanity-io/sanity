import {error, HELP_IDS} from '../createValidationResult'
import {flatten} from 'lodash'
import {getDupes} from '../utils/getDupes'


export default (typeDef, visitor) => {
  // name should already have been marked
  const problems = flatten([
    Array.isArray(typeDef.of)
      ? getDupes(typeDef.of, t => `${t.name};${t.type}`).map(dupes =>
        error(
          `Found ${dupes.length} members with same type, but not unique names "${dupes[0]
            .type}" in array. This makes it impossible to tell their values apart and you should consider naming them`,
          HELP_IDS.ARRAY_OF_NOT_UNIQUE
        ))
      : error(
        'The array type is missing or having an invalid value for the required "of" property',
        HELP_IDS.ARRAY_OF_INVALID
      )
  ])

  return {
    ...typeDef,
    of: (typeDef.of || []).map(visitor.visit),
    _problems: problems
  }
}
