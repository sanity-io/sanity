import {FormFieldSet as BaseFormFieldSet} from '@sanity/base/components'
import React, {ComponentProps, ForwardedRef, forwardRef, useMemo} from 'react'
import {Marker} from '@sanity/types'

import {EMPTY_ARRAY} from '../utils/empty'

export interface FormFieldSetProps extends ComponentProps<typeof BaseFormFieldSet> {
  changeIndicator?: boolean
  markers?: Marker[]
  presence?: any[]
}

function resolveChildren<T>(children: T | (() => T)): T {
  return typeof children === 'function' ? (children as () => T)() : children
}

// todo: turn into context provided component
export const FormFieldSet = forwardRef(function FormFieldSet(
  props: FormFieldSetProps,
  ref: ForwardedRef<HTMLElement>
) {
  const {
    children: childrenProp,
    changeIndicator,
    presence = EMPTY_ARRAY,
    markers = EMPTY_ARRAY,
    ...rest
  } = props

  return (
    <BaseFormFieldSet {...rest} ref={ref}>
      {resolveChildren(childrenProp)}
    </BaseFormFieldSet>
  )
})
