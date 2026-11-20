import {findExtendableType} from '../../builtinTypes/extendableTypes'
import {error} from '../createValidationResult'

/**
 * A schema may replace an extendable type to add fields. Its core fields always
 * come from the built-in definition (`resolveExtendableTypes`), so only the
 * type itself is checked here.
 */
export default (typeDef: any) => {
  const extendable = findExtendableType(typeDef.name)
  if (!extendable || typeDef.type === 'object') return {...typeDef, _problems: []}

  return {
    ...typeDef,
    _problems: [
      error(`The "${typeDef.name}" type must be an object type, but it is "${typeDef.type}".`),
    ],
  }
}
