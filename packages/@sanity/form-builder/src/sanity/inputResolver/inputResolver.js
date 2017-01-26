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

export default function inputResolver(type) {
  if (type.component) {
    return type.component
  }
  if (type.editor === 'slate') {
    return SlateBlockEditor
  }
  if (type.name === 'reference') {
    return resolveReference(type)
  }
  if (type.name === 'image') {
    return Image
  }
  if (type.name === 'file') {
    return File
  }
  return type.editor || coreTypes[type.name]
}
