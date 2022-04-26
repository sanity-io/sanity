import React, {useMemo} from 'react'
import {isValidationErrorMarker, ObjectSchemaType} from '@sanity/types'
import {FormInputProps, PatchEvent, set, unset} from '@sanity/form-builder'
import {Select} from '@sanity/ui'

type Value = {title: string; value: string}

interface CustomObjectSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: {list?: Value[]}
}

type CustomObjectSelectInputProps = FormInputProps<Value, CustomObjectSchemaType>

const EMPTY_ARRAY: Value[] = []

let objectSelectInputIdx = 0
export const CustomObjectSelectInput = React.forwardRef(function CustomObjectSelectInput(
  props: CustomObjectSelectInputProps,
  forwardedRef: React.ForwardedRef<HTMLSelectElement>
) {
  const {value, readOnly, validation, type, level, onChange, presence} = props
  const items = (type.options && type.options.list) || EMPTY_ARRAY
  const errors = validation.filter(isValidationErrorMarker)
  const [inputId] = React.useState(() => String(++objectSelectInputIdx))
  const _items = useMemo(() => [{title: '', value: undefined}, ...items], [items])

  const handleChange = React.useCallback(
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
    <Select
      onChange={handleChange}
      id={inputId}
      ref={forwardedRef}
      readOnly={readOnly}
      customValidity={errors?.[0]?.item.message}
      value={value?.value || ''}
    >
      {_items.map((item, i) => (
        <option key={i} value={item.value || ''}>
          {item.title}
        </option>
      ))}
    </Select>
  )
})
