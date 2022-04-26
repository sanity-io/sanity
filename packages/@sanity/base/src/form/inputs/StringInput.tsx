import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {useFormNode} from '../components/formNode'

export function StringInput(props: StringInputProps) {
  const {validation} = useFormNode()
  const {inputProps, value, type, onChange} = props
  const {readOnly, id, ref, onFocus, onBlur} = inputProps
  const placeholder = type.placeholder
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      id={id}
      customValidity={errors.length > 0 ? errors[0].item.message : ''}
      value={value || ''}
      readOnly={Boolean(readOnly)}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={ref}
    />
  )
}
