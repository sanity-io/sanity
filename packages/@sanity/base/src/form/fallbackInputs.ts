import {ObjectInput} from './inputs/ObjectInput'
import {ArrayInput} from './inputs/arrays/ArrayOfObjectsInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: {input: ObjectInput},
  array: {input: ArrayInput},
  boolean: {input: BooleanInput},
  number: {input: NumberInput},
  string: {input: TextInput},
}
