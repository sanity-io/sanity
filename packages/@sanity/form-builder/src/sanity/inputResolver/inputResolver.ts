import defaultInputs from './defaultInputs'
import * as is from '../../utils/is'
import resolveReferenceInput from './resolveReferenceInput'
import resolveArrayInput from './resolveArrayInput'
import resolveStringInput from './resolveStringInput'
import resolveNumberInput from './resolveNumberInput'
import {
  BooleanInput,
  DateTimeInput,
  EmailInput,
  GeoPointInput,
  NumberInput,
  ObjectInput,
  ReferenceInput,
  StringInput,
  TextInput,
  UrlInput,
} from '../../legacyParts'

const CUSTOM_INPUT_MAP = {
  object: ObjectInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: StringInput,
  text: TextInput,
  reference: ReferenceInput,
  datetime: DateTimeInput,
  email: EmailInput,
  geopoint: GeoPointInput,
  url: UrlInput,
}

function getExport(obj) {
  return obj && obj.__esModule ? obj.default : obj
}

// this is needed to avoid errors due to circular imports
// this can happen if a custom input component imports and tries
// to access something from the form-builder immediately (top-level)
let getCustomResolver = () => {
  // TODO(@benedicteb, 2021-01-18) How can we move this to legacyParts.ts?
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

  if (is.type('number', type)) {
    return resolveNumberInput(type)
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

  return resolveTypeVariants(type) || CUSTOM_INPUT_MAP[type.name] || defaultInputs[type.name]
}
