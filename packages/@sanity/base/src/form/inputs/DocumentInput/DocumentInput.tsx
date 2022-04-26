import React, {memo} from 'react'
import {ObjectInput} from '../ObjectInput'
import {ObjectInputProps} from '../../types'

export const DocumentInput = memo(function DocumentInput(props: ObjectInputProps) {
  return <ObjectInput {...props} />
})
