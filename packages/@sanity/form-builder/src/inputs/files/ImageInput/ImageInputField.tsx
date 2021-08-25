import React from 'react'
import * as PathUtils from '@sanity/util/paths'
import {Marker, ObjectField, Path} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent from '../../../PatchEvent'
import {ConditionalField} from '../../common/ConditionalField'
import {FormBuilderInput} from '../../../FormBuilderInput'

interface ImageInputFieldProps {
  field: ObjectField
  onChange: (event: PatchEvent) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  parentValue: Record<string, unknown>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean
  focusPath: Path
  compareValue: any
  markers: Marker[]
  level: number
  presence: FormFieldPresence[]
}

export function ImageInputField(props: ImageInputFieldProps) {
  const {onChange, field, ...restProps} = props

  const handleChange = React.useCallback(
    (ev: PatchEvent) => {
      onChange(ev.prefixAll(field.name))
    },
    [onChange, field]
  )

  return (
    <ConditionalField
      parent={props.parentValue}
      value={props.value}
      hidden={props.field.type.hidden}
    >
      <FormBuilderInput
        {...restProps}
        type={field.type}
        path={PathUtils.pathFor([field.name])}
        onChange={handleChange}
      />
    </ConditionalField>
  )
}
