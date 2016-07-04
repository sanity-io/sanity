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

import {
  ArrayField,
  BooleanField,
  ObjectField,
  DefaultField
} from './defaultFieldComponents'

import ValidationList from './validation/ValidationList'

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

const typeNameToFieldMap = {
  boolean: BooleanField,
  object: ObjectField,
  array: ArrayField
}

function resolveInputComponent(field, schemaType) {
  return typeNameToInputMap[field.type] || typeNameToInputMap[schemaType.type]
}

function resolveFieldComponent(field, schemaType) {
  return typeNameToFieldMap[field.type] || typeNameToFieldMap[schemaType.type] || DefaultField
}
function resolveValidationComponent(field, schemaType) {
  return ValidationList
}
function resolvePreviewComponent(field, schemaType) {

}
export default {
  resolveInputComponent,
  resolveFieldComponent,
  resolveValidationComponent,
  resolvePreviewComponent
}
