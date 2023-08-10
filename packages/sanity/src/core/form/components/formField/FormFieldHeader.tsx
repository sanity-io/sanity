/* eslint-disable camelcase */
import React, {memo} from 'react'
import {FormNodeValidation} from '@sanity/types'
import {FormNodePresence} from '../../../presence'
import {DocumentFieldActionNode} from '../../../config'
import {FormFieldHeaderText} from './FormFieldHeaderText'
import {FormFieldBaseHeader} from './FormFieldBaseHeader'

const EMPTY_ARRAY: never[] = []

export interface FormFieldHeaderProps {
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_actions?: DocumentFieldActionNode[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  /**
   * @beta
   */
  validation?: FormNodeValidation[]
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  title?: React.ReactNode

  /** @hidden */
  fieldHovered: boolean
  /** @hidden */
  fieldFocused: boolean
}

export const FormFieldHeader = memo(function FormFieldHeader(props: FormFieldHeaderProps) {
  const {
    __unstable_actions: actions = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    description,
    fieldFocused,
    fieldHovered,
    inputId,
    title,
    validation,
  } = props

  return (
    <FormFieldBaseHeader
      actions={actions}
      fieldFocused={fieldFocused}
      fieldHovered={fieldHovered}
      presence={presence}
      content={
        <FormFieldHeaderText
          validation={validation}
          description={description}
          inputId={inputId}
          title={title}
        />
      }
    />
  )
})
