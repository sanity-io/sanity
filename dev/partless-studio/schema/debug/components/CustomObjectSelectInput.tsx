import {FormField} from '@sanity/base/_unstable'
import {ObjectFieldProps, PatchEvent, set, unset} from '@sanity/base/form'
import {isValidationErrorMarker, ObjectSchemaType} from '@sanity/types'
import {Select} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

type Value = {title: string; value: string}

interface CustomSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: {list?: Value[]}
}

type CustomObjectSelectInputProps = ObjectFieldProps<Value, CustomSchemaType>

const EMPTY_ARRAY: Value[] = []

let objectSelectInputIdx = 0

export const CustomObjectSelectInput = React.forwardRef(function CustomObjectSelectInput(
  props: CustomObjectSelectInputProps,
  forwardedRef: React.ForwardedRef<HTMLSelectElement>
) {
  const {value, readOnly, validation, type, level, onChange, presence} = props
  const items = (type.options && type.options.list) || EMPTY_ARRAY
  const errors = validation.filter(isValidationErrorMarker)
  const [inputId] = useState(() => String(++objectSelectInputIdx))

  const handleChange = useCallback(
    (evt) => {
      onChange(
        PatchEvent.from(
          evt.target.value ? set(items.find((item) => item.value === evt.target.value)) : unset()
        )
      )
    },
    [onChange, items]
  )
  return (
    <FormField
      inputId={inputId}
      level={level}
      title={type.title}
      description={type.description}
      validation={validation}
      __unstable_presence={presence}
    >
      <Select
        onChange={handleChange}
        id={inputId}
        ref={forwardedRef}
        readOnly={readOnly}
        customValidity={errors?.[0]?.item.message}
        value={value?.value || ''}
      >
        {[{title: '', value: undefined}, ...items].map((item, i) => (
          <option key={i} value={item.value}>
            {item.title}
          </option>
        ))}
      </Select>
    </FormField>
  )
})
