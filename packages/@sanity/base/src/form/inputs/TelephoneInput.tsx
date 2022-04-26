import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {useFormNode} from '../components/formNode'

export type TelephoneInputProps = StringInputProps

export function TelephoneInput(props: TelephoneInputProps) {
  const {validation} = useFormNode()
  const {value, type, inputProps, onChange} = props
  const {onFocus, onBlur, readOnly, ref} = inputProps
  const inputId = useId()
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
      id={inputId}
      inputMode="tel"
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      placeholder={type.placeholder}
      readOnly={Boolean(readOnly)}
      ref={ref}
      type="tel"
      value={value || ''}
    />
  )
}
