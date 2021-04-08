import {ComponentType} from 'react'
import {ArraySchemaType} from '@sanity/types'
import * as is from '../../utils/is'
import OptionsArray from '../../inputs/arrays/OptionsArrayInput'
import PortableTextInput from '../../inputs/PortableText/PortableTextInput'
import ArrayOfPrimitivesInput from '../../inputs/arrays/ArrayOfPrimitivesInput'
import {TagsArrayInput} from '../../inputs/TagsArrayInput'
import SanityArrayInput from '../inputs/SanityArrayInput'
import {Props} from '../../inputs/types'

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

export default function resolveArrayInput(type: ArraySchemaType): ComponentType<Props> {
  // Schema provides predefines list
  if (hasOptionsList(type)) {
    // @todo: fix typing
    return OptionsArray as ComponentType<any>
  }

  if (isStringArray(type) && isTagsArray(type)) {
    return TagsArrayInput
  }

  // Special component for array of primitive values
  if (isArrayOfPrimitives(type)) {
    // @todo: fix typing
    return ArrayOfPrimitivesInput as ComponentType<any>
  }

  // Use Portable Text editor if portable text.
  if (isPortableText(type)) {
    // @todo: fix typing
    return PortableTextInput as ComponentType<any>
  }

  // use default
  // @todo: fix typing
  return SanityArrayInput as ComponentType<any>
}
