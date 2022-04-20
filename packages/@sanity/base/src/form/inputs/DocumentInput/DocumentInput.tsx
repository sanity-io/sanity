/* eslint-disable react/no-unused-prop-types */

import React, {ForwardedRef, forwardRef, memo} from 'react'
import {ObjectSchemaTypeWithOptions} from '@sanity/types'
import {FieldGroup, ObjectMember, RenderFieldCallback} from '../../store/types'
import {FormInputProps} from '../../types'
import {ObjectInput} from '../ObjectInput'

export interface DocumentInputProps
  extends FormInputProps<Record<string, unknown>, ObjectSchemaTypeWithOptions> {
  members: ObjectMember[]
  groups?: FieldGroup[]
  renderField: RenderFieldCallback
  onSelectGroup: (name: string) => void

  collapsible?: boolean
  collapsed?: boolean

  onSetCollapsed: (collapsed: boolean) => void
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
    return <ObjectInput ref={forwardedRef} {...props} />
  })
)
