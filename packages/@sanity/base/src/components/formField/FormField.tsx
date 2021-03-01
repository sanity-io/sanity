/* eslint-disable camelcase */

import {Marker} from '@sanity/types'
import {Stack} from '@sanity/ui'
import React, {memo} from 'react'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../../change-indicators'
import {FormFieldPresence} from '../../presence'
import {FormFieldHeader} from './FormFieldHeader'

export interface FormFieldProps {
  /**
   * @beta
   */
  __unstable_changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  /**
   * @beta
   */
  __unstable_markers?: Marker[]
  /**
   * @beta
   */
  __unstable_presence?: FormFieldPresence[]
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

export const FormField = memo(function FormField(
  props: FormFieldProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>
) {
  const {
    __unstable_changeIndicator: changeIndicator = true,
    __unstable_markers: markers,
    __unstable_presence: presence,
    children,
    description,
    inputId,
    level,
    title,
    ...restProps
  } = props

  let content = children

  if (changeIndicator) {
    const changeIndicatorProps = typeof changeIndicator === 'object' ? changeIndicator : {}

    content = <ChangeIndicator {...changeIndicatorProps}>{children}</ChangeIndicator>
  }

  return (
    <Stack {...restProps} data-level={level} space={1}>
      {/*
        NOTE: It’s not ideal to hide validation, presence and description when there's no `title`.
        So we might want to separate the concerns of input vs formfield components later on.
      */}
      {title && (
        <FormFieldHeader
          __unstable_markers={markers}
          __unstable_presence={presence}
          description={description}
          inputId={inputId}
          title={title}
        />
      )}

      <div>{content}</div>
    </Stack>
  )
})
