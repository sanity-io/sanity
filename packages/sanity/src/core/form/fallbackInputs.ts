import React from 'react'
import {FIXME} from '../FIXME'
import {ObjectInput} from './inputs/ObjectInput'
import {UniversalArrayInput} from './inputs/arrays/UniversalArrayInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput as React.ComponentType<FIXME>,
  array: UniversalArrayInput as React.ComponentType<FIXME>,
  boolean: BooleanInput as React.ComponentType<FIXME>,
  number: NumberInput as React.ComponentType<FIXME>,
  string: TextInput as React.ComponentType<FIXME>,
}
