import {SchemaType} from '@sanity/types'
import {FormInputComponentResolver} from '../../../form'
import {resolveInputComponent} from '../../sanity/inputResolver/inputResolver'
import {DebugInput} from './DebugInput'

export const inputResolver: FormInputComponentResolver = (input: SchemaType) => {
  if (!input.type) {
    throw new Error('inputResolver: missing subtype')
  }

  if (input.type.name === 'document') {
    input.type.name = 'object'
  }

  const resolved = resolveInputComponent({}, undefined, input.type)

  if (resolved) {
    return resolved
  }

  return DebugInput
}
