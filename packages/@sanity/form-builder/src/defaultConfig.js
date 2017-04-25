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
  Any,
  TextInput,
  UrlInput
} from './defaultInputComponents'

import ArrayOfPrimitives from './inputs/ArrayOfPrimitives'
import SearchableStringSelect from './inputs/SearchableStringSelect'
import StringSelect from './inputs/StringSelect'
import OptionsArray from './inputs/OptionsArray'
import BlockEditor from './inputs/BlockEditor-slate'
import TagsArray from './inputs/TagsArray'

const typeNameToInputMap = {
  object: ObjectInput,
  array: ArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  url: UrlInput,
  image: Image,
  any: Any,
  file: File,
  reference: Reference,
  string: StringInput,
  slug: Slug
}

const PRIMITIVES = ['string', 'number', 'boolean']

function is(typeName, type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}

function isPrimitive(type) {
  return PRIMITIVES.some(typeName => is(typeName, type))
}

function isArrayOfPrimitives(type) {
  return is('array', type) && type.of.every(isPrimitive)
}

function isTagsArray(type) {
  return type.options && type.options.layout === 'tags'
    && is('array', type)
    && type.of.length === 1
    && is('string', type.of[0])
}

function hasBlockMember(type) {
  return is('array', type) && type.of.find(memberType => is('block', memberType))
}

function isOptionsArray(type) {
  return is('array', type) && type.options && type.options.list
}

function isList(type) {
  return type.options && type.options.list
}

function isSearchable(type) {
  return type.options.searchable
}

export function resolveInputComponent(type) {

  // Schema provides predefines list
  if (isOptionsArray(type)) {
    return OptionsArray
  }

  if (isTagsArray(type)) {
    return TagsArray
  }

  // Special component for array of strings
  if (isArrayOfPrimitives(type)) {
    return ArrayOfPrimitives
  }

  // Special component for array of strings
  if (hasBlockMember(type)) {
    return BlockEditor
  }

  // String input with a select
  if (isList(type) && is('string', type)) {
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
