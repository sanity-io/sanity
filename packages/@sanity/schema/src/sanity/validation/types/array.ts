import {error, HELP_IDS} from '../createValidationResult'
import {flatten} from 'lodash'
import {getDupes} from '../utils/getDupes'

export default (typeDef, visitorContext) => {
  // name should already have been marked
  const ofIsArray = Array.isArray(typeDef.of)

  if (ofIsArray) {
    const invalid = typeDef.of.reduce((errs, def, idx) => {
      if (def.type === 'array') {
        return errs.concat(
          error(
            `Found array member declaration of type "array" - multidimensional arrays are not currently supported by Sanity`,
            HELP_IDS.ARRAY_OF_ARRAY
          )
        )
      }

      if (def) {
        return errs
      }

      const err = `Found ${def === null ? 'null' : typeof def}, expected member declaration`
      return errs.concat(
        error(
          `Found invalid type member declaration in array at index ${idx}: ${err}`,
          HELP_IDS.ARRAY_OF_INVALID
        )
      )
    }, [])

    if (invalid.length > 0) {
      return {
        ...typeDef,
        of: [],
        _problems: invalid,
      }
    }
  }

  const problems = flatten([
    ofIsArray
      ? getDupes(typeDef.of, (t) => `${t.name};${t.type}`).map((dupes) =>
          error(
            `Found ${dupes.length} members with same type, but not unique names "${dupes[0].type}" in array. This makes it impossible to tell their values apart and you should consider naming them`,
            HELP_IDS.ARRAY_OF_NOT_UNIQUE
          )
        )
      : error(
          'The array type is missing or having an invalid value for the required "of" property',
          HELP_IDS.ARRAY_OF_INVALID
        ),
  ])
  const of = ofIsArray ? typeDef.of : []

  // Don't allow object types without a name in block arrays
  const hasObjectTypesWithoutName = of.some(
    (type) => type.type === 'object' && typeof type.name === 'undefined'
  )
  const hasBlockType = of.some((ofType) => ofType.type === 'block')
  if (hasBlockType && hasObjectTypesWithoutName) {
    problems.push(
      error(
        "The array type's 'of' property can't have an object type without a 'name' property as member, when the 'block' type is also a member of that array.",
        HELP_IDS.ARRAY_OF_INVALID
      )
    )
  }

  return {
    ...typeDef,
    of: of.map(visitorContext.visit),
    _problems: problems,
  }
}
