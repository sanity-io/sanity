import ObjectInput from './inputs/Object/Object'
import ArrayInput from './inputs/Array/Array'
import BooleanInput from './inputs/Boolean'
import NumberInput from './inputs/Number'
import TextInput from './inputs/Text'

export const fallbackInputs = {
  object: ObjectInput,
  array: ArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: TextInput
}
