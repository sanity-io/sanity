import {
  ArraySchemaType,
  NumberSchemaType,
  ReferenceSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {FIXME, InputProps} from '../../types'
import * as is from '../../utils/is'
import {resolveReferenceInput} from './resolveReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'
import {defaultInputs} from './defaultInputs'

function resolveTypeVariants(type: SchemaType): React.ComponentType<FIXME> | undefined {
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

  return undefined
}

export function defaultResolveInputComponent(
  schemaType: SchemaType
): React.ComponentType<InputProps> | undefined {
  return resolveTypeVariants(schemaType) || defaultInputs[schemaType.name]
}
