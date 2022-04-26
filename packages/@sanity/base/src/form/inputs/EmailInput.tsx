import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {useFormNode} from '../components/formNode'

export type EmailInputProps = StringInputProps

export function EmailInput(props: EmailInputProps) {
  const {validation} = useFormNode()
  const {inputProps, value, type, onChange} = props
  const {id, onBlur, onFocus, readOnly, ref} = inputProps
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      customValidity={errors.length > 0 ? errors[0].item.message : ''}
      id={id}
      inputMode="email"
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      placeholder={type.placeholder}
      readOnly={Boolean(readOnly)}
      ref={ref}
      type="email"
      value={value || ''}
    />
  )
}
