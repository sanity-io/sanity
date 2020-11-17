import React from 'react'
import {NumberSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import FormField from 'part:@sanity/components/formfields/default'
import {useId} from '@reach/auto-id'
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
  const onlyPositiveNumber = minRule && minRule.constraint >= 0
  return (
    <FormField
      markers={markers}
      level={level}
      label={type.title}
      description={type.description}
      labelFor={id}
      presence={presence}
    >
      <TextInput
        id={id}
        customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
        type="number"
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={React.useCallback(
          (event: React.SyntheticEvent<HTMLInputElement>) => {
            const nextValue = event.currentTarget.value
            onChange(PatchEvent.from(nextValue === '' ? unset() : set(Number(nextValue))))
          },
          [onChange]
        )}
        onFocus={onFocus}
        ref={forwardedRef}
        pattern={onlyPositiveNumber ? '[d]*' : undefined}
      />
    </FormField>
  )
})

export default NumberInput
