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
function resolveInputComponent(field, schemaType) {
  return typeNameToInputMap[field.type] || typeNameToInputMap[schemaType.type]
}

function resolvePreviewComponent(field, schemaType) {

}
export default {
  resolveInputComponent,
  resolvePreviewComponent
}
