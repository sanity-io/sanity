import customInputs from './customInputs'
import defaultInputs from './defaultInputs'
import * as is from '../../utils/is'
import SearchableStringSelect from '../../inputs/SearchableStringSelect'
import StringSelect from '../../inputs/StringSelect'
import resolveReferenceInput from './resolveReferenceInput'
import resolveArrayInput from './resolveArrayInput'
import resolveStringInput from './resolveStringInput'

function getExport(obj) {
  return obj && obj.__esModule ? obj.default : obj
}

// this is needed to avoid errors due to circular imports
// this can happen if a custom input component imports and tries
// to access something from the form-builder immediately (top-level)
let getCustomResolver = () => {
  const resolver = getExport(require('part:@sanity/form-builder/input-resolver?'))
  getCustomResolver = () => resolver
  return resolver
}

function resolveTypeVariants(type) {
  if (is.type('array', type)) {
    return resolveArrayInput(type)
  }

  if (is.type('reference', type)) {
    return resolveReferenceInput(type)
  }

  // String input with a select
  if (is.type('string', type)) {
    return resolveStringInput(type)
  }

  return null
}

export default function resolveInputComponent(type) {
  const customResolver = getCustomResolver()

  const custom = customResolver && customResolver(type)
  if (custom) {
    return custom
  }

  if (type.inputComponent) {
    return type.inputComponent
  }

  return resolveTypeVariants(type)
    || customInputs[type.name]
    || defaultInputs[type.name]
}
