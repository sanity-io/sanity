import React, {memo} from 'react'
import {ObjectInput} from '../ObjectInput'
import {ObjectInputComponentProps} from '../../types'

export const DocumentInput = memo(function DocumentInput(props: ObjectInputComponentProps) {
  return <ObjectInput {...props} />
})
