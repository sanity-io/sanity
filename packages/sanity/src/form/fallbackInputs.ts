import React from 'react'
import {ObjectInput} from './inputs/ObjectInput'
import {ArrayInput} from './inputs/arrays/ArrayOfObjectsInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'
import {FIXME} from './types'

export const fallbackInputs = {
  object: ObjectInput as React.ComponentType<FIXME>,
  array: ArrayInput as React.ComponentType<FIXME>,
  boolean: BooleanInput as React.ComponentType<FIXME>,
  number: NumberInput as React.ComponentType<FIXME>,
  string: TextInput as React.ComponentType<FIXME>,
}
