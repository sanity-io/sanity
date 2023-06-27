import {FormNodeValidation} from '@sanity/types'
import {Stack} from '@sanity/ui'
import React, {memo} from 'react'
import {FormNodePresence} from '../../../presence'
import {FormFieldHeader} from './FormFieldHeader'

/** @internal */
export interface FormFieldProps {
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_headerActions?: React.ReactNode
  /**
   * @beta
   */
  validation?: FormNodeValidation[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  children: React.ReactNode
  description?: React.ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  /**
   * The nesting level of the form field
   */
  level?: number
  title?: React.ReactNode
}

/** @internal */
export const FormField = memo(function FormField(
  props: FormFieldProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>
) {
  const {
    validation,
    __unstable_headerActions: headerActions,
    __unstable_presence: presence,
    children,
    description,
    inputId,
    level,
    title,
    ...restProps
  } = props
  return (
    <Stack {...restProps} data-level={level} space={1}>
      {/*
        NOTE: It’s not ideal to hide validation, presence and description when there's no `title`.
        So we might want to separate the concerns of input vs formfield components later on.
      */}
      {title && (
        <FormFieldHeader
          __unstable_actions={headerActions}
          validation={validation}
          __unstable_presence={presence}
          description={description}
          inputId={inputId}
          title={title}
        />
      )}

      <div>{children}</div>
    </Stack>
  )
})
