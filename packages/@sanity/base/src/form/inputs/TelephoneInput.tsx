import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '../../components/formField'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export type TelephoneInputProps = StringInputProps

export function TelephoneInput(props: TelephoneInputProps) {
  const {value, type, validation, level, inputProps, onChange, presence} = props
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
    <FormField
      __unstable_presence={presence}
      description={type.description}
      inputId={inputId}
      level={level}
      title={type.title}
      validation={validation}
    >
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
    </FormField>
  )
}
