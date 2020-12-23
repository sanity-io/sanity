import ObjectInput from './inputs/ObjectInput'
import ArrayInput from './inputs/arrays/ArrayOfObjectsInput'
import BooleanInput from './inputs/BooleanInput'
import NumberInput from './inputs/NumberInput'
import TextInput from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput,
  array: ArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: TextInput,
}
