import array from 'role:@sanity/form-builder/input/array?'
import boolean from 'role:@sanity/form-builder/input/boolean?'
import date from 'role:@sanity/form-builder/input/date?'
import email from 'role:@sanity/form-builder/input/email?'
import geopoint from 'role:@sanity/form-builder/input/geopoint?'
import number from 'role:@sanity/form-builder/input/number?'
import object from 'role:@sanity/form-builder/input/object?'
import reference from 'role:@sanity/form-builder/input/reference?'
import string from 'role:@sanity/form-builder/input/string?'
import text from 'role:@sanity/form-builder/input/text?'
import url from 'role:@sanity/form-builder/input/url?'
import SlateBlockEditor from '../../inputs/BlockEditor-slate'

import DefaultReference from '../inputs/Reference'

const primitiveTypes = {
  array,
  boolean,
  date,
  number,
  object,
  reference: reference || DefaultReference,
  string
}
const bundledTypes = {
  email,
  geopoint,
  text,
  url
}
const coreTypes = Object.assign({}, primitiveTypes, bundledTypes)

const inputResolver = (field, fieldType) => {
  if (field.component || fieldType.component) {
    return field.component || fieldType.component
  }
  const inputRole = coreTypes[field.type] || coreTypes[fieldType.name]
  if (field.input === 'slate') {
    return SlateBlockEditor
  }
  return field.input || inputRole
}

export default inputResolver
