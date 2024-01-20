import {type ComponentType} from 'react'

import {type FIXME} from '../FIXME'
import {UniversalArrayInput} from './inputs/arrays/UniversalArrayInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {ObjectInput} from './inputs/ObjectInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput as ComponentType<FIXME>,
  array: UniversalArrayInput as ComponentType<FIXME>,
  boolean: BooleanInput as ComponentType<FIXME>,
  number: NumberInput as ComponentType<FIXME>,
  string: TextInput as ComponentType<FIXME>,
}
