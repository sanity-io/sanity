import {SchemaType} from '@sanity/types'
import {defaultResolveInputComponent} from '../../studio/inputResolver/inputResolver'
import {FormInputComponentResolver} from '../../types'
import {DebugInput} from './DebugInput'

export const inputResolver: FormInputComponentResolver = (input: SchemaType) => {
  if (!input.type) {
    throw new Error('inputResolver: missing subtype')
  }

  if (input.type.name === 'document') {
    input.type.name = 'object'
  }

  const resolved = defaultResolveInputComponent(input.type)

  if (resolved) {
    return resolved
  }

  return DebugInput
}
