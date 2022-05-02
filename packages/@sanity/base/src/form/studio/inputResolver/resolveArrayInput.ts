import {ArraySchemaType} from '@sanity/types'
import {ComponentType} from 'react'
import * as is from '../../utils/is'
import {OptionsArrayInput as OptionsArray} from '../../inputs/arrays/OptionsArrayInput'
import {PortableTextInput} from '../../inputs/PortableText/PortableTextInput'
import {TagsArrayInput} from '../../inputs/TagsArrayInput'
import {StudioArrayInput, StudioArrayOfPrimitivesInput} from '../inputs/StudioArrayInput'

const PRIMITIVES = ['string', 'number', 'boolean']

export function isArrayOfPrimitives(type: ArraySchemaType): boolean {
  return type.of.every((ofType) => PRIMITIVES.includes(ofType.jsonType))
}

function isStringArray(type: ArraySchemaType): type is ArraySchemaType<string> {
  return type.of.length === 1 && is.type('string', type.of[0])
}

function isTagsArray(type: ArraySchemaType<string>): boolean {
  return type.options?.layout === 'tags'
}

function isPortableText(type: ArraySchemaType): boolean {
  // TODO: better testing here, not only for type 'block' !
  return type.of.some((memberType) => is.type('block', memberType))
}

export function hasOptionsList(type: ArraySchemaType): boolean {
  return Boolean(type.options?.list)
}

export function resolveArrayInput(type: ArraySchemaType): ComponentType<any> {
  // Schema provides predefines list
  if (hasOptionsList(type)) {
    return OptionsArray
  }

  if (isStringArray(type) && isTagsArray(type)) {
    return TagsArrayInput
  }

  // Special component for array of primitive values
  if (isArrayOfPrimitives(type)) {
    return StudioArrayOfPrimitivesInput
  }

  // Use Portable Text editor if portable text.
  if (isPortableText(type)) {
    return PortableTextInput
  }

  // use default
  return StudioArrayInput
}
