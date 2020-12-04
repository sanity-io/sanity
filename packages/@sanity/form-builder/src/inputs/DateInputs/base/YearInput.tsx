import React from 'react'
import {TextInput} from '@sanity/ui'
import {LazyInput} from './LazyInput'

type Props = Omit<React.ComponentProps<typeof TextInput>, 'onChange' | 'value'> & {
  value?: number
  onChange: (year: number) => void
}

export const YearInput = ({onChange, ...props}: Props) => {
  const handleChange = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseInt(event.currentTarget.value, 10)
      if (!isNaN(numericValue)) {
        onChange(numericValue)
      }
    },
    [onChange]
  )

  return <LazyInput {...props} onChange={handleChange} inputMode="numeric" />
}
