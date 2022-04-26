import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {getValidationRule} from '../utils/getValidationRule'
import {NumberInputProps} from '../types'
import {useFormNode} from '../components/formNode'

export function NumberInput(props: NumberInputProps) {
  const {validation} = useFormNode()
  const {inputProps, value = '', type, onChange} = props
  const {id, onFocus, readOnly, ref} = inputProps
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(type, 'min')
  const onlyPositiveNumber = (minRule?.constraint || 0) >= 0

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue === '' ? unset() : set(Number(nextValue)))
    },
    [onChange]
  )

  return (
    <TextInput
      type="number"
      step="any"
      inputMode={onlyPositiveNumber ? 'numeric' : 'text'}
      id={id}
      customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
      value={value}
      readOnly={Boolean(readOnly)}
      placeholder={type.placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      ref={ref}
      pattern={onlyPositiveNumber ? '[d]*' : undefined}
    />
  )
}
