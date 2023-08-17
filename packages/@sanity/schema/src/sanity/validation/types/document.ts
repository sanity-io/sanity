import {isPlainObject} from 'lodash'
import {error} from '../createValidationResult'
import object from './object'

export default (typeDefinition, visitorContext) => {
  const typeDef = object(typeDefinition, visitorContext)
  const {initialValue, initialValues} = typeDef

  const hasInitialValue = typeof initialValue !== 'undefined'
  if (hasInitialValue && !isPlainObject(initialValue) && typeof initialValue !== 'function') {
    typeDef._problems.push(
      error(`The "initialValue" property must be either a plain object or a function`),
    )
  }

  if (typeof initialValues !== 'undefined') {
    typeDef._problems.push(error(`Found property "initialValues" - did you mean "initialValue"?`))
  }

  return typeDef
}
