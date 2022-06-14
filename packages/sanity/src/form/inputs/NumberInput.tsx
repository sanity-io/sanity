import React from 'react'

import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {set, unset} from '../patch'
import {getValidationRule} from '../utils/getValidationRule'
import {NumberInputProps} from '../types'
import {ChangeIndicator} from '../../components/changeIndicators'

export const NumberInput = React.forwardRef(function NumberInput(
  props: NumberInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {
    changed,
    focused,
    onChange,
    onFocus,
    path,
    readOnly,
    schemaType,
    validationError,
    value = '',
  } = props
  const id = useId()

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(schemaType, 'min')
  const onlyPositiveNumber = (minRule?.constraint || 0) >= 0

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue === '' ? unset() : set(Number(nextValue)))
    },
    [onChange]
  )

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      <TextInput
        type="number"
        step="any"
        inputMode={onlyPositiveNumber ? 'numeric' : 'text'}
        id={id}
        customValidity={validationError}
        value={value}
        readOnly={Boolean(readOnly)}
        placeholder={schemaType.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        ref={forwardedRef}
        pattern={onlyPositiveNumber ? '[d]*' : undefined}
      />
    </ChangeIndicator>
  )
})
