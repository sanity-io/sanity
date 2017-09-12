import React from 'react'
import customResolver from 'part:@sanity/form-builder/input-resolver?'

import ArrayInput from 'part:@sanity/form-builder/input/array?'
import BooleanInput from 'part:@sanity/form-builder/input/boolean?'
import EmailInput from 'part:@sanity/form-builder/input/email?'
import GeoPointInput from 'part:@sanity/form-builder/input/geopoint?'
import NumberInput from 'part:@sanity/form-builder/input/number?'
import ObjectInput from 'part:@sanity/form-builder/input/object?'
import ReferenceInput from 'part:@sanity/form-builder/input/reference?'
import RichDateInput from 'part:@sanity/form-builder/input/rich-date?'
import StringInput from 'part:@sanity/form-builder/input/string?'
import TextInput from 'part:@sanity/form-builder/input/text?'
import UrlInput from 'part:@sanity/form-builder/input/url?'
import codeInput from 'part:@sanity/form-builder/input/code?'
import SlugInput from '../inputs/Slug'
import FileInput from '../inputs/File'
import ImageInput from '../inputs/Image'

import resolveReference from './resolveReference'

const DeprecatedDateInput = RichDateInput

const typeInputMap = {
  array: ArrayInput,
  object: ObjectInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: StringInput,
  text: TextInput,
  reference: ReferenceInput,
  date: DeprecatedDateInput,
  richDate: RichDateInput,
  email: EmailInput,
  file: FileInput,
  image: ImageInput,
  slug: SlugInput,
  geopoint: GeoPointInput,
  code: codeInput,
  url: UrlInput
}

export default function inputResolver(type) {
  const custom = customResolver && customResolver(type)
  if (custom) {
    return custom
  }

  if (type.inputComponent) {
    return type.inputComponent
  }

  if (type.name === 'reference') {
    return resolveReference(type)
  }

  return typeInputMap[type.name]
}
