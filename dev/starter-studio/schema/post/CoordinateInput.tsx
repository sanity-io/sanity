import {TextInput} from '@sanity/ui'
import React, {useCallback} from 'react'
import {NumberInputProps, set, unset} from 'sanity/form'

export function CoordinateInput(props: NumberInputProps) {
  const {
    id,
    // inputProps,
    onBlur,
    onChange,
    onFocus,
    readOnly,
    schemaType,
    value = '',
  } = props

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
      // {...inputProps}
      id={id}
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      placeholder={schemaType.placeholder}
      readOnly={readOnly}
      value={value}
    />
  )
}
