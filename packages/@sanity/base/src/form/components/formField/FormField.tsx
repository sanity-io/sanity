/* eslint-disable camelcase */

import {ValidationMarker} from '@sanity/types'
import {Stack} from '@sanity/ui'
import React, {memo} from 'react'
import {useFormNode} from '../formNode'
import {
  ChangeIndicator,
  ChangeIndicatorContextProvidedProps,
} from '../../../components/changeIndicators'
import {FormFieldHeader} from './FormFieldHeader'

export interface FormFieldProps {
  /**
   * @internal
   */
  __internal_description?: React.ReactNode

  /**
   * @internal
   */
  __internal_level?: number

  /**
   * @internal
   */
  __internal_title?: React.ReactNode

  /**
   * @internal
   */
  __internal_validation?: ValidationMarker[]

  /**
   * @alpha
   */
  __unstable_changeIndicator?: ChangeIndicatorContextProvidedProps | boolean

  children: React.ReactNode
}

export const FormField = memo(function FormField(
  props: FormFieldProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'title'>
) {
  const {level: contextLevel, validation: contextValidation, type} = useFormNode()
  const {
    __internal_description: description,
    __internal_level: level = contextLevel,
    __internal_title: title = type.title,
    __internal_validation: validation = contextValidation,
    __unstable_changeIndicator: changeIndicator = true,
    children,
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
          __internal_description={description}
          __internal_title={title}
          __internal_validation={validation}
        />
      )}

      <div>{content}</div>
    </Stack>
  )
})
