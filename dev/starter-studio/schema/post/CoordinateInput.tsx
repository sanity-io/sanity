import {TextInput} from '@sanity/ui'
import React, {useCallback} from 'react'
import {NumberInputProps, set, unset} from 'sanity/form'

export function CoordinateInput(props: NumberInputProps) {
  const {inputProps, onChange, type, value = ''} = props

  // We need to create value patch messages based on the user input
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value

      onChange(nextValue ? set(Number(nextValue)) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      {...inputProps}
      onChange={handleChange}
      placeholder={type.placeholder}
      value={value}
    />
  )
}
