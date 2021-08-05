import React, {ComponentProps} from 'react'
import {Marker} from '@sanity/types'
import {FormField as BaseFormField} from '@sanity/base/components'

import {EMPTY_ARRAY} from '../utils/empty'

export interface FormFieldProps extends ComponentProps<any> {
  changeIndicator?: boolean
  markers?: Marker[]
  presence?: any[]
}

// todo: turn into context provided component
export function FormField(props: FormFieldProps) {
  const {children, changeIndicator, presence = EMPTY_ARRAY, markers = EMPTY_ARRAY, ...rest} = props

  return <BaseFormField {...rest}>{children}</BaseFormField>
}
