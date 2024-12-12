import {Select} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback, useId} from 'react'
import {isValidationError, type ObjectInputProps, type ObjectSchemaType, set, unset} from 'sanity'

type Value = {title: string; value: string}

interface CustomSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: {list?: Value[]}
}

type CustomObjectSelectInputProps = ObjectInputProps<Value, CustomSchemaType>

const EMPTY_ARRAY: Value[] = []

export const CustomObjectSelectInput = forwardRef(function CustomObjectSelectInput(
  props: CustomObjectSelectInputProps,
  forwardedRef: ForwardedRef<HTMLSelectElement>,
) {
  const {value, schemaType, onChange, readOnly, validation} = props

  const items = (schemaType.options && schemaType.options.list) || EMPTY_ARRAY
  const errors = validation.filter(isValidationError)
  const inputId = useId()

  const handleChange = useCallback(
    (evt: any) => {
      onChange(
        evt.target.value ? set(items.find((item) => item.value === evt.target.value)) : unset(),
      )
    },
    [onChange, items],
  )

  return (
    <Select
      onChange={handleChange}
      id={inputId}
      ref={forwardedRef}
      readOnly={readOnly}
      customValidity={errors?.[0]?.message}
      value={value?.value || ''}
    >
      {[{title: '', value: undefined}, ...items].map((item, i) => (
        <option key={i} value={item.value}>
          {item.title}
        </option>
      ))}
    </Select>
  )
})
