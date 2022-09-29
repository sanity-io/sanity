import React from 'react'
import {FIXME} from '../FIXME'
import {ObjectInput} from './inputs/ObjectInput'
import {ArrayOfObjectsInput} from './inputs/arrays/ArrayOfObjectsInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'

export const fallbackInputs = {
  object: ObjectInput as React.ComponentType<FIXME>,
  array: ArrayOfObjectsInput as React.ComponentType<FIXME>,
  boolean: BooleanInput as React.ComponentType<FIXME>,
  number: NumberInput as React.ComponentType<FIXME>,
  string: TextInput as React.ComponentType<FIXME>,
}
