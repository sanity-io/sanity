import React from 'react'
import {FIXME} from '../FIXME'
import {ObjectInput} from './inputs/ObjectInput'
import {Input} from './inputs/arrays/ArrayOfObjectsInput/List/Input'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput as React.ComponentType<FIXME>,
  array: Input as React.ComponentType<FIXME>,
  boolean: BooleanInput as React.ComponentType<FIXME>,
  number: NumberInput as React.ComponentType<FIXME>,
  string: TextInput as React.ComponentType<FIXME>,
}
