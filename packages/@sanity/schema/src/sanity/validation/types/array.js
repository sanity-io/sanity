import {error, warning} from '../createValidationResult'
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
          'schema-array-type-of-must-have-unique-types'
        ))
      : error(
        'The array type is missing or having an invalid value for the required "of" property',
        'schema-array-type-of-must-be-array'
      )
  ])

  return {
    ...typeDef,
    of: (typeDef.of || []).map(visitor.visit),
    _problems: problems
  }
}
