import React from 'react'
import {NumberSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import {getValidationRule} from '../utils/getValidationRule'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const NumberInput = React.forwardRef(function NumberInput(
  props: Props<number, NumberSchemaType>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value = '', readOnly, markers, type, level, onFocus, onChange, presence} = props
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')
  const id = useId()

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(type, 'min')
  const onlyPositiveNumber = minRule?.constraint >= 0

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value
      onChange(PatchEvent.from(nextValue === '' ? unset() : set(Number(nextValue))))
    },
    [onChange]
  )
  return (
    <FormField
      level={level}
      __unstable_markers={markers}
      title={type.title}
      description={type.description}
      inputId={id}
      __unstable_presence={presence}
    >
      <TextInput
        type="number"
        inputMode={onlyPositiveNumber ? 'numeric' : 'text'}
        id={id}
        customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        ref={forwardedRef}
        pattern={onlyPositiveNumber ? '[d]*' : undefined}
      />
    </FormField>
  )
})

export default NumberInput
