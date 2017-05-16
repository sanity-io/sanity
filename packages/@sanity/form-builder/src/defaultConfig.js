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
import SearchableStringSelect from './inputs/SearchableStringSelect'
import StringSelect from './inputs/StringSelect'
import ArrayOfStringsSelect from './inputs/Array/ArrayOfStringsSelect'
import BlockEditor from './inputs/BlockEditor-slate'

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

function hasBlockMember(type) {
  return type.name === 'array'
    && type.of.find(memberType => memberType.name === 'block')
}

function hasListInOptions(type) {
  return type.options && type.options.list
}

function isList(type) {
  return type.options && type.options.list
}

function isSearchable(type) {
  return type.options.searchable
}

export function resolveInputComponent(type) {

  // Schema provides predefines list
  if (hasListInOptions(type) && isArrayOfStrings(type)) {
    return ArrayOfStringsSelect
  }

  // Special component for array of strings
  if (isArrayOfStrings(type)) {
    return ArrayOfStrings
  }

  // Special component for array of strings
  if (hasBlockMember(type)) {
    return BlockEditor
  }

  // String input with a select
  if (type.name === 'string' && isList(type)) {
    return isSearchable(type) ? SearchableStringSelect : StringSelect
  }

  return typeNameToInputMap[type.name]
}

export function resolvePreviewComponent(type) {
  // leave empty for now
}

export const jsonTypeFallbacks = {
  object: ObjectInput,
  array: ArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: TextInput
}
