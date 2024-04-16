import {type TextInput} from '@sanity/ui'
import {type ChangeEvent, type ComponentProps, type FocusEvent, useCallback} from 'react'

import {LazyTextInput} from '../LazyTextInput'

type Props = Omit<ComponentProps<typeof TextInput>, 'onChange' | 'value'> & {
  value?: number
  onChange: (year: number) => void
}

export const YearInput = ({onChange, ...props}: Props) => {
  const handleChange = useCallback(
    (event: FocusEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseInt(event.currentTarget.value, 10)
      if (!isNaN(numericValue)) {
        onChange(numericValue)
      }
    },
    [onChange],
  )

  return <LazyTextInput {...props} onChange={handleChange} inputMode="numeric" />
}
