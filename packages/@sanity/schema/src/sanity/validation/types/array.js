import {flatten} from 'lodash'
import {error, HELP_IDS} from '../createValidationResult'
import {getDupes} from '../utils/getDupes'

function isBlockType(type) {
  if (type.type && type.type !== 'type') {
    return type.type === 'block'
  }
  if (type.type === 'type') {
    return type.name === 'block'
  }
  return false
}

export default (typeDef, visitorContext) => {
  // name should already have been marked
  const ofIsArray = Array.isArray(typeDef.of)
  const problems = flatten([
    ofIsArray
      ? getDupes(typeDef.of, t => `${t.name};${t.type}`).map(dupes =>
          error(
            `Found ${dupes.length} members with same type, but not unique names "${
              dupes[0].type
            }" in array. This makes it impossible to tell their values apart and you should consider naming them`,
            HELP_IDS.ARRAY_OF_NOT_UNIQUE
          )
        )
      : error(
          'The array type is missing or having an invalid value for the required "of" property',
          HELP_IDS.ARRAY_OF_INVALID
        )
  ])
  const of = ofIsArray ? typeDef.of : []

  // Don't allow object types without a name in block arrays
  const hasObjectTypesWithoutName = of.some(
    type => type.type === 'object' && typeof type.name === 'undefined'
  )
  const blockTypes = of.filter(ofType =>
    isBlockType(visitorContext.getType(ofType.type), visitorContext)
  )
  if (blockTypes.length > 1) {
    problems.push(
      error(
        "The array type's 'of' property can't have more than one block type in the array.",
        HELP_IDS.ARRAY_OF_INVALID
      )
    )
  }
  const hasBlockType = blockTypes.length > 0
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
    _problems: problems
  }
}
