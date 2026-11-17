import {TextInput} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {timeInput} from './TimeInput.css'

export function TimeInput(props: ComponentProps<typeof TextInput>) {
  const {className, ...rest} = props

  return <TextInput {...rest} type="time" className={clsx(timeInput, className)} />
}
