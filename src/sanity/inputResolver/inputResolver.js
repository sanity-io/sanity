import array from 'part:@sanity/form-builder/input/array?'
import boolean from 'part:@sanity/form-builder/input/boolean?'
import date from 'part:@sanity/form-builder/input/date?'
import email from 'part:@sanity/form-builder/input/email?'
import geopoint from 'part:@sanity/form-builder/input/geopoint?'
import number from 'part:@sanity/form-builder/input/number?'
import object from 'part:@sanity/form-builder/input/object?'
import reference from 'part:@sanity/form-builder/input/reference?'
import string from 'part:@sanity/form-builder/input/string?'
import text from 'part:@sanity/form-builder/input/text?'
import url from 'part:@sanity/form-builder/input/url?'
import SlateBlockEditor from '../../inputs/BlockEditor-slate'

import resolveReference from './resolveReference'
import Image from '../inputs/Image'
import File from '../inputs/File'

const primitiveTypes = {
  array,
  boolean,
  date,
  number,
  object,
  reference: reference,
  string
}
const bundledTypes = {
  email,
  geopoint,
  text,
  url
}
const coreTypes = Object.assign({}, primitiveTypes, bundledTypes)

export default function inputResolver(field, fieldType) {
  if (field.component || fieldType.component) {
    return field.component || fieldType.component
  }
  const inputRole = coreTypes[field.type] || coreTypes[fieldType.name]
  if (field.editor === 'slate') {
    return SlateBlockEditor
  }
  if (field.type === 'reference') {
    return resolveReference(field)
  }
  if (field.type === 'image') {
    return Image
  }
  if (field.type === 'file') {
    return File
  }
  return field.editor || inputRole
}
