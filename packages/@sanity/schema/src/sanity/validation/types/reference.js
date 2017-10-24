// @flow
import type {TypeDef, ValidationResult} from '../../typedefs'
import {error, HELP_IDS, warning} from '../createValidationResult'
import inspect from '../../inspect'

type MemberValidator = TypeDef => Array<ValidationResult>

function validateToType(
  ofType: TypeDef,
  validateMember: MemberValidator
): Array<ValidationResult> {
  // todo: check for mix of primitive / complex values
  return validateMember(ofType)
}

type ToType = {
  type: string
}

function getDuplicateTypes(array: Array<ToType>): Array<Array<ToType>> {
  const dupes: {[string]: Array<ToType>} = {}
  array.forEach(field => {
    if (!dupes[field.type]) {
      dupes[field.type] = []
    }
    dupes[field.type].push(field)
  })
  return Object.keys(dupes)
    .map(typeName => (dupes[typeName].length > 1 ? dupes[typeName] : null))
    .filter(Boolean)
}

export default {
  validate(
    typeDef: TypeDef,
    validateMember: MemberValidator
  ): Array<ValidationResult> {
    let result = []
    if (Array.isArray(typeDef.to)) {
      typeDef.to.forEach(toType => {
        result = result.concat(validateToType(toType, validateMember))
      })

      getDuplicateTypes(typeDef.to).forEach(dupes => {
        result.push(
          error(
            `Found ${dupes.length} members with type "${dupes[0]
              .type}" in ${inspect(typeDef)}`,
            HELP_IDS.REFERENCE_TO_NOT_UNIQUE
          )
        )
      })
    } else {
      result.push(
        error(
          'The reference type is missing or having an invalid value for the "to" property',
          HELP_IDS.REFERENCE_TO_INVALID
        )
      )
    }
    return result
  }
}
