import {SchemaType} from '@sanity/types'
import {resolveInputComponent} from '../../studio/inputResolver/inputResolver'
import {FormInputComponentResolver} from '../../types'
import {DebugInput} from './DebugInput'

export const inputResolver: FormInputComponentResolver = (input: SchemaType) => {
  if (!input.type) {
    throw new Error('inputResolver: missing subtype')
  }

  if (input.type.name === 'document') {
    input.type.name = 'object'
  }

  const resolved = resolveInputComponent(undefined, undefined, input.type)

  if (resolved) {
    return resolved
  }

  return DebugInput
}
