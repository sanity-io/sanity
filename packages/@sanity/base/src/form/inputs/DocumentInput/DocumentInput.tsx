/* eslint-disable react/no-unused-prop-types */

import React, {ForwardedRef, forwardRef, memo, useCallback} from 'react'
import {ObjectSchemaTypeWithOptions} from '@sanity/types'
import {FieldGroup, ObjectMember, RenderFieldCallbackArg} from '../../store/types'
import {FormInputProps} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {ObjectInput} from '../ObjectInput'

export interface DocumentInputProps
  extends FormInputProps<Record<string, unknown>, ObjectSchemaTypeWithOptions> {
  members: ObjectMember[]
  groups: FieldGroup[]
  onSelectGroup: (name: string) => void
}

/**
 * Please read this about collapsible fields
 * To support deep linking, the received focusPath must always takes precedence over internal collapsed/expanded state.
 * If a field has been expanded (either manually by the user, or because the focus path has caused it to expand) it
 * should then stay open and *not* collapse when the field loses focus (e.g. no autocollapse!)
 * If a field has been actively collapsed by the user, it must still expand again if it receives focus on a path within later on.
 */

// disable eslint false positive
// eslint-disable-next-line react/display-name
export const DocumentInput = memo(
  forwardRef(function DocumentInput(
    props: DocumentInputProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    const {resolveInputComponent} = useFormBuilder()
    const renderField = useCallback(
      (field: RenderFieldCallbackArg) => {
        const Input = resolveInputComponent(field.type)
        if (!Input) {
          return <div>No input resolved for type: {field.type.name}</div>
        }
        return <Input {...field} validation={[]} presence={[]} renderField={renderField} />
      },
      [resolveInputComponent]
    )
    return <ObjectInput ref={forwardedRef} {...props} renderField={renderField} />
  })
)
