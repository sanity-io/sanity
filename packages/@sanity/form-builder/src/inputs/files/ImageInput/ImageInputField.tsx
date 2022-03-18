import React from 'react'
import * as PathUtils from '@sanity/util/paths'
import {ObjectField} from '@sanity/types'
import {PatchEvent, FormInputProps} from '@sanity/base/form'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ConditionalHiddenField, ConditionalReadOnlyField} from '../../common'

interface ImageInputFieldProps extends Omit<FormInputProps<unknown>, 'type'> {
  field: ObjectField
  parentValue: Record<string, unknown>
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
    <ConditionalHiddenField
      parent={props.parentValue}
      value={props.value}
      hidden={props.field.type.hidden}
    >
      <ConditionalReadOnlyField
        readOnly={props.readOnly}
        value={props.value}
        parent={props.parentValue}
      >
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
