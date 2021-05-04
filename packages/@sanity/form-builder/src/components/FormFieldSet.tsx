import {FormFieldSet as BaseFormFieldSet, FormFieldValidationStatus} from '@sanity/base/components'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import React, {ComponentProps, ForwardedRef, forwardRef, useMemo} from 'react'
import {isValidationMarker, Marker} from '@sanity/types'

import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import {EMPTY_ARRAY} from '../utils/empty'

export interface FormFieldSetProps extends ComponentProps<typeof BaseFormFieldSet> {
  changeIndicator?: boolean
  markers?: Marker[]
  presence?: FormFieldPresence[]
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

  const validationMarkers = useMemo(() => markers.filter(isValidationMarker), [markers])

  return (
    <BaseFormFieldSet
      {...rest}
      ref={ref}
      presence={presence.length > 0 && <FieldPresence maxAvatars={4} presence={presence} />}
      validation={
        validationMarkers.length > 0 && <FormFieldValidationStatus fontSize={1} markers={markers} />
      }
    >
      {changeIndicator
        ? () => <ChangeIndicator>{resolveChildren(childrenProp)}</ChangeIndicator>
        : childrenProp}
    </BaseFormFieldSet>
  )
})
