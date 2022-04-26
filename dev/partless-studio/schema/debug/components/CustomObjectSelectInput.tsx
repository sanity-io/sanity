import {FormField} from '@sanity/base/_unstable'
import {ObjectInputProps, set, unset, useFormNode} from '@sanity/base/form'
import {isValidationErrorMarker, ObjectSchemaType} from '@sanity/types'
import {Select} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

type Value = {title: string; value: string}

interface CustomSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: {list?: Value[]}
}

type CustomObjectSelectInputProps = ObjectInputProps<Value, CustomSchemaType>

const EMPTY_ARRAY: Value[] = []

let objectSelectInputIdx = 0

export const CustomObjectSelectInput = React.forwardRef(function CustomObjectSelectInput(
  props: CustomObjectSelectInputProps,
  forwardedRef: React.ForwardedRef<HTMLSelectElement>
) {
  const {validation} = useFormNode()
  const {inputProps, value, type, onChange} = props
  const {readOnly} = inputProps
  const items = (type.options && type.options.list) || EMPTY_ARRAY
  const errors = validation.filter(isValidationErrorMarker)
  const [inputId] = useState(() => String(++objectSelectInputIdx))

  const handleChange = useCallback(
    (evt) => {
      onChange(
        evt.target.value ? set(items.find((item) => item.value === evt.target.value)) : unset()
      )
    },
    [onChange, items]
  )

  return (
    <FormField>
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
