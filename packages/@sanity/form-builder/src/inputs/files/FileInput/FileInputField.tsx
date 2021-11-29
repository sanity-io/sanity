import React from 'react'
import * as PathUtils from '@sanity/util/paths'
import type {FormFieldPresence} from '@sanity/base/presence'
import type {Marker, ObjectField, Path} from '@sanity/types'
import type PatchEvent from '../../../PatchEvent'
import {ConditionalField} from '../../common/ConditionalField'
import {FormBuilderInput} from '../../../FormBuilderInput'

interface FileInputFieldProps {
  field: ObjectField
  onChange: (event: PatchEvent) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: unknown
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

export function FileInputField(props: FileInputFieldProps) {
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
