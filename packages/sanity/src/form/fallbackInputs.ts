import React from 'react'
import {ObjectInput} from './inputs/ObjectInput'
import {ArrayInput} from './inputs/arrays/ArrayOfObjectsInput'
import {BooleanInput} from './inputs/BooleanInput'
import {NumberInput} from './inputs/NumberInput'
import {TextInput} from './inputs/TextInput'
import {FIXME} from './types'

export const fallbackInputs = {
  object: ObjectInput as React.ElementType<FIXME>,
  array: ArrayInput as React.ElementType<FIXME>,
  boolean: BooleanInput as React.ElementType<FIXME>,
  number: NumberInput as React.ElementType<FIXME>,
  string: TextInput as React.ElementType<FIXME>,
}
