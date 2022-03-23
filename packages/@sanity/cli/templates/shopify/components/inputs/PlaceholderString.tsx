import {FormField} from '@sanity/base/components'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import {Marker, Path} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import get from 'lodash.get'
import {withDocument} from 'part:@sanity/form-builder'
import React, {forwardRef, RefObject, useCallback} from 'react'

// TODO: use correct type
type Props = {
  markers: Marker[]
  onBlur: () => void
  onChange: (event: any) => void
  onFocus: (path: Path) => void
  type: any
  value: any
}

const PlaceholderStringInput = forwardRef((props: Props, ref: RefObject<HTMLInputElement>) => {
  const {
    compareValue,
    document,
    markers,
    onBlur,
    onChange,
    onFocus,
    presence,
    readOnly,
    type,
    value,
  } = props

  const handleChange = useCallback(
    // useCallback will help with performance
    (event) => {
      const inputValue = event.currentTarget.value // get current value

      // if the value exists, set the data, if not, unset the data
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  const proxyValue = get(document, type?.options?.field)

  const inputId = uuid()

  return (
    <FormField
      compareValue={compareValue}
      description={type?.description}
      inputId={inputId}
      markers={markers}
      presence={presence}
      title={type?.title}
    >
      <TextInput
        defaultValue={value}
        id={inputId}
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        placeholder={proxyValue}
        readOnly={readOnly}
        ref={ref}
      />
    </FormField>
  )
})

export default withDocument(PlaceholderStringInput)
