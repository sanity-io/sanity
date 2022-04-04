import {
  ArraySchemaType,
  NumberSchemaType,
  ReferenceSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {FormInputProps, FIXME} from '../../types'
import * as is from '../../utils/is'
import {isSanityInputType, sanityInputs} from './defaultInputs'
import {resolveReferenceInput} from './resolveReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'

function resolveTypeVariants(type: SchemaType) {
  if (is.type('array', type)) {
    return resolveArrayInput(type as ArraySchemaType)
  }

  if (is.type('reference', type)) {
    return resolveReferenceInput(type as ReferenceSchemaType)
  }

  // String input with a select
  if (is.type('string', type)) {
    return resolveStringInput(type as StringSchemaType)
  }

  if (is.type('number', type)) {
    return resolveNumberInput(type as NumberSchemaType)
  }

  return null
}

export function resolveInputComponent(
  inputComponents:
    | Record<string, React.ComponentType<FormInputProps<any, any>> | undefined>
    | undefined,
  userDefinedInputComponentProp: unknown,
  type: SchemaType
): React.ComponentType<any> | undefined {
  const customInputComponent =
    typeof userDefinedInputComponentProp === 'function' && userDefinedInputComponentProp(type)

  if (customInputComponent) {
    return customInputComponent
  }

  if ('inputComponent' in type && (type as FIXME).inputComponent) {
    return (type as FIXME).inputComponent
  }

  const matchedComponent = resolveTypeVariants(type) || inputComponents?.[type.name]

  if (matchedComponent) return matchedComponent

  // Resolve default input components
  if (isSanityInputType(type.name)) {
    return sanityInputs[type.name]
  }

  return undefined
}
