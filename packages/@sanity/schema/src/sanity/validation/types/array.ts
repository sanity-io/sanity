import {error, HELP_IDS, warning} from '../createValidationResult'
import {flatten} from 'lodash'
import {getDupes} from '../utils/getDupes'
import {coreTypeNames} from '../../coreTypes'

export default (typeDef, visitorContext) => {
  // name should already have been marked
  const ofIsArray = Array.isArray(typeDef.of)

  if (ofIsArray) {
    const invalid = typeDef.of.reduce((errs, def, idx) => {
      if (typeof def.name === 'string') {
        // If an array member has been given a "local" type name, we want to trigger an error if the given member type name
        // is one of the builtin types
        //
        // The following examples should be an error (where book is an existing root level type and reference is a built-in type):
        //  - (…) of: [{type: 'book', name: 'image'}]
        //  - (…) of: [{type: 'book', name: 'object'}]
        //  - (…) of: [{type: 'object', name: 'reference'}]
        // The following examples are valid (where "address" is not defined as a global object type)
        //  - (…) of: [{type: 'object', name: 'address'}]
        // The following examples are redundant, but should be allowed (at least for now)
        //  - (…) of: [{type: 'object', name: 'object'}]
        //  - (…) of: [{type: 'image', name: 'image'}]

        if (
          // specifying the same name as the type is redundant, but should not be a hard error at this point
          // Consider showing a warning for this and deprecate this ability eventually
          def.name !== def.type &&
          coreTypeNames.includes(def.name)
        ) {
          return errs.concat(
            error(
              `Found array member declaration with the same type name as a built-in type ("${def.name}"). Array members can not be given the same name as a built-in type.`,
              HELP_IDS.ARRAY_OF_TYPE_BUILTIN_TYPE_CONFLICT
            )
          )
        }
      }

      if (def.type === 'object' && def.name && visitorContext.getType(def.name)) {
        return errs.concat(
          warning(
            `Found array member declaration with the same name as the global schema type "${def.name}". It's recommended to use a unique name to avoid possibly incompatible data types that shares the same name.`,
            HELP_IDS.ARRAY_OF_TYPE_GLOBAL_TYPE_CONFLICT
          )
        )
      }
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

  if (typeDef?.options?.list && typeDef?.options?.layout === 'tags') {
    problems.push(
      warning(
        'Found array member declaration with both tags layout and a list of predefined values. If you want to display a list of predefined values, remove the tags layout from `options`.'
      )
    )
  }

  return {
    ...typeDef,
    of: of.map(visitorContext.visit),
    _problems: problems,
  }
}
