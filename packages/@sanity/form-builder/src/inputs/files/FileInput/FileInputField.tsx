import React from 'react'
import * as PathUtils from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import {Marker, ObjectField, Path} from '@sanity/types'
import PatchEvent from '../../../PatchEvent'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ConditionalHiddenField} from '../../common/ConditionalHiddenField'

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
    <ConditionalHiddenField
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
    </ConditionalHiddenField>
  )
}
