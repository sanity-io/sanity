/* eslint-disable react/jsx-handler-names */
import {ArraySchemaType, NumberSchemaType, SchemaType, StringSchemaType} from '@sanity/types'
import React from 'react'
import {InputProps} from '../../types'
import * as is from '../../utils/is'
import {PreviewProps} from '../../../components'
import {SanityDefaultPreview} from '../../../preview'
import {FIXME} from '../../../FIXME'
import {StudioReferenceInput} from '../inputs/reference/StudioReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'
import {defaultInputs} from './defaultInputs'
import {getTypeChain} from './helpers'

function resolveComponentFromTypeVariants(
  type: SchemaType
): React.ComponentType<FIXME> | undefined {
  if (is.type('array', type)) {
    return resolveArrayInput(type as ArraySchemaType)
  }

  if (is.type('reference', type)) {
    return StudioReferenceInput
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
): React.ComponentType<Omit<InputProps, 'renderDefault'>> {
  if (schemaType.components?.input) return schemaType.components.input

  const componentFromTypeVariants = resolveComponentFromTypeVariants(schemaType)
  if (componentFromTypeVariants) {
    return componentFromTypeVariants
  }

  const typeChain = getTypeChain(schemaType, new Set())
  const deduped = typeChain.reduce((acc, type) => {
    acc[type.name] = type
    return acc
  }, {} as Record<string, SchemaType>)

  // using an object + Object.values to de-dupe the type chain by type name
  const subType = Object.values(deduped).find((t) => defaultInputs[t.name])

  if (subType) {
    return defaultInputs[subType.name]
  }

  throw new Error(`Could not find input component for schema type \`${schemaType.name}\``)
}

export function defaultResolvePreviewComponent(
  schemaType: SchemaType
): React.ComponentType<Omit<PreviewProps, 'renderDefault'>> {
  if (schemaType.components?.preview) return schemaType.components.preview

  return SanityDefaultPreview
}
