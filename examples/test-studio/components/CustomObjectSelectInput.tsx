// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {Marker, ObjectSchemaType} from '@sanity/types'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'
import {FormField} from '@sanity/base/components'
import {Select} from '@sanity/ui'

type Value = {title: string; value: string}

type Props = {
  type: ObjectSchemaType & {options?: {list?: Value[]}}
  level: number
  value: Value | null | undefined
  readOnly: boolean | null
  onChange: (patchEvent: unknown) => void
  markers: Marker[]
  presence: unknown[]
}

const EMPTY_ARRAY: Value[] = []

let objectSelectInputIdx = 0
export const CustomObjectSelectInput = React.forwardRef(function CustomObjectSelectInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLSelectElement | HTMLInputElement>
) {
  const {value, readOnly, markers, type, level, onChange, presence} = props
  const items = (type.options && type.options.list) || EMPTY_ARRAY
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')
  const [inputId] = React.useState(() => ++objectSelectInputIdx)

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
    <FormField
      inputId={inputId}
      level={level}
      title={type.title}
      description={type.description}
      __unstable_markers={markers}
      __unstable_presence={presence}
    >
      <Select
        onChange={handleChange}
        id={inputId}
        ref={forwardedRef}
        readOnly={readOnly}
        customValidity={errors?.[0]?.item.message}
        value={value && value.value}
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
