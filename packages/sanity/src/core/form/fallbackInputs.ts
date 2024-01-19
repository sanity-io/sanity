import {ComponentType} from 'react'
import {FIXME} from '../FIXME'
import {ObjectInput} from './inputs/ObjectInput'
import {UniversalArrayInput} from './inputs/arrays/UniversalArrayInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput as ComponentType<FIXME>,
  array: UniversalArrayInput as ComponentType<FIXME>,
  boolean: BooleanInput as ComponentType<FIXME>,
  number: NumberInput as ComponentType<FIXME>,
  string: TextInput as ComponentType<FIXME>,
}
