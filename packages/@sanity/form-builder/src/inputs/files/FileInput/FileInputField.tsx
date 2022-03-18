import React from 'react'
import * as PathUtils from '@sanity/util/paths'
import {ConditionalProperty, ObjectField} from '@sanity/types'
import {PatchEvent} from '../../../PatchEvent'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ConditionalHiddenField, ConditionalReadOnlyField} from '../../common'
import {FormInputProps} from '../../../types'

export interface FileInputFieldProps extends Omit<FormInputProps<unknown>, 'readOnly' | 'type'> {
  field: ObjectField
  parentValue: Record<string, unknown>
  readOnly: ConditionalProperty
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
      <ConditionalReadOnlyField readOnly={props.readOnly} value={props.value}>
        <FormBuilderInput
          {...restProps}
          type={field.type}
          path={PathUtils.pathFor([field.name])}
          onChange={handleChange}
        />
      </ConditionalReadOnlyField>
    </ConditionalHiddenField>
  )
}
