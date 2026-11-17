import isPlainObject from 'lodash-es/isPlainObject.js'

import inspect from '../../inspect'
import {error} from '../createValidationResult'
import object from './object'

const VERSION_KINDS = ['releases', 'scheduled-drafts', 'variants']

export default (typeDefinition: any, visitorContext: any) => {
  const typeDef = object(typeDefinition, visitorContext)
  const {initialValue, initialValues, versions} = typeDef

  const hasInitialValue = typeof initialValue !== 'undefined'
  if (hasInitialValue && !isPlainObject(initialValue) && typeof initialValue !== 'function') {
    typeDef._problems.push(
      error(`The "initialValue" property must be either a plain object or a function`),
    )
  }

  if (typeof initialValues !== 'undefined') {
    typeDef._problems.push(error(`Found property "initialValues" - did you mean "initialValue"?`))
  }

  const isValidVersions =
    typeof versions === 'undefined' ||
    (Array.isArray(versions) && versions.every((kind) => VERSION_KINDS.includes(kind)))
  if (!isValidVersions) {
    typeDef._problems.push(
      error(
        `The "versions" property must be an array of "releases", "scheduled-drafts" and "variants". Saw ${inspect(versions)}`,
      ),
    )
  }

  return typeDef
}
