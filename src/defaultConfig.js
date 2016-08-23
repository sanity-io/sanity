import {
  ArrayInput,
  BooleanInput,
  EmailInput,
  NumberInput,
  ObjectInput,
  StringInput,
  Reference,
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
  reference: Reference,
  string: StringInput
}

function isArrayOfStrings(fieldOrType) {
  return fieldOrType.type == 'array' && fieldOrType.of.every(field => field.type === 'string')
}

function resolveInputComponent(field, schemaType) {

  // Special component for array of strings
  if (isArrayOfStrings(field) || isArrayOfStrings(schemaType)) {
    return ArrayOfStrings
  }

  // String input with a select
  if (field.type == 'string' && field.options && field.options.list && !field.options.searchable) {
    return StringSelect
  }
  if (field.type == 'string' && field.options && field.options.list && field.options.searchable) {
    return SearchableStringSelect
  }

  return typeNameToInputMap[field.type] || typeNameToInputMap[schemaType.type]
}

function resolvePreviewComponent(field, schemaType) {

}
export default {
  resolveInputComponent,
  resolvePreviewComponent
}
