import {TextInput} from '@sanity/ui'
import {forwardRef} from 'react'

import {timeInput} from './TimeInput.css'

export const TimeInput = forwardRef(function TimeInput(
  props: React.ComponentProps<typeof TextInput>,
  ref: React.Ref<HTMLInputElement>,
) {
  return <TextInput {...props} className={timeInput} type="time" ref={ref} />
})
