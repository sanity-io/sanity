import {isPlainObject} from 'lodash'
import {error} from '../createValidationResult'
import object from './object'

export default (typeDefinition, visitorContext) => {
  const typeDef = object(typeDefinition, visitorContext)
  const {initialValue, initialValues} = typeDef

  const hasInitialValues = typeof initialValues !== 'undefined'
  if (hasInitialValues && !isPlainObject(initialValues) && typeof initialValues !== 'function') {
    typeDef._problems.push(
      error(`The "initialValues" property must be either a plain object or a function`)
    )
  }

  if (typeof initialValue !== 'undefined') {
    typeDef._problems.push(error(`Found property "initialValue" - did you mean "initialValues"?`))
  }

  return typeDef
}
