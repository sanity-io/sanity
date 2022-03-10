import {SchemaType} from '@sanity/types'
import React from 'react'
import * as is from '../../utils/is'
import {FormBuilderContextValue} from '../../FormBuilderContext'
import {sanityInputs} from './defaultInputs'
import resolveReferenceInput from './resolveReferenceInput'
import resolveArrayInput from './resolveArrayInput'
import resolveStringInput from './resolveStringInput'
import resolveNumberInput from './resolveNumberInput'

function resolveTypeVariants(type) {
  if (is.type('array', type)) {
    return resolveArrayInput(type)
  }

  if (is.type('reference', type)) {
    return resolveReferenceInput(type)
  }

  // String input with a select
  if (is.type('string', type)) {
    return resolveStringInput(type)
  }

  if (is.type('number', type)) {
    return resolveNumberInput(type)
  }

  return null
}

export default function resolveInputComponent(
  inputComponents: FormBuilderContextValue['components']['inputs'] | undefined,
  userDefinedInputComponentProp: unknown,
  type: SchemaType
): React.ComponentType<any> | undefined {
  const customInputComponent =
    typeof userDefinedInputComponentProp === 'function' && userDefinedInputComponentProp(type)

  if (customInputComponent) {
    return customInputComponent
  }

  if ('inputComponent' in type && (type as any).inputComponent) {
    return (type as any).inputComponent
  }

  return resolveTypeVariants(type) || inputComponents?.[type.name] || sanityInputs[type.name]
}
