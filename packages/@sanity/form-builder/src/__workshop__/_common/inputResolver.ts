import resolveInputComponent from '../../sanity/inputResolver/inputResolver'
import {DebugInput} from './input'

export const inputResolver = (input: any) => {
  if (input.type.name === 'document') {
    input.type.name = 'object'
  }
  const resolved = resolveInputComponent(input.type)
  if (resolved) {
    return resolved
  }

  return DebugInput
}
