import {
  ArrayInput,
  BooleanInput,
  EmailInput,
  NumberInput,
  ObjectInput,
  StringInput,
  Reference,
  Image,
  File,
  Slug,
  TextInput,
  UrlInput
} from './defaultInputComponents'

import ArrayOfStrings from './inputs/Array/ArrayOfStrings'
import StringSelect from './inputs/StringSelect'
import SearchableStringSelect from './inputs/SearchableStringSelect'

const typeNameToInputMap = {
  object: ObjectInput,
  array: ArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  url: UrlInput,
  image: Image,
  file: File,
  reference: Reference,
  string: StringInput,
  slug: Slug
}

function isArrayOfStrings(type) {
  return type.name === 'array' && type.of.every(ofType => ofType.name === 'string')
}
function isList(type) {
  return type.options && type.options.list
}

function isSearchable(type) {
  return type.options.searchable
}

function resolveInputComponent(type) {
  // Special component for array of strings
  if (isArrayOfStrings(type)) {
    return ArrayOfStrings
  }

  // String input with a select
  if (type.name === 'string' && isList(type)) {
    return isSearchable(type) ? SearchableStringSelect : StringSelect
  }

  return typeNameToInputMap[type.name]
}

export default {
  resolveInputComponent: resolveInputComponent,
  resolvePreviewComponent: () => {}
}
