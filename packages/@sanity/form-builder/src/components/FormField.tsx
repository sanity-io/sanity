import {FormField as BaseFormField, FormFieldValidationStatus} from '@sanity/base/components'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import React, {ComponentProps, useMemo} from 'react'
import {isValidationMarker, Marker} from '@sanity/types'

import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import {EMPTY_ARRAY} from '../utils/empty'

export interface FormFieldProps extends ComponentProps<typeof BaseFormField> {
  changeIndicator?: boolean
  markers?: Marker[]
  presence?: FormFieldPresence[]
}

// todo: turn into context provided component
export function FormField(props: FormFieldProps) {
  const {children, changeIndicator, presence = EMPTY_ARRAY, markers = EMPTY_ARRAY, ...rest} = props
  const validationMarkers = useMemo(() => markers.filter(isValidationMarker), [markers])

  return (
    <BaseFormField
      {...rest}
      presence={presence.length > 0 && <FieldPresence maxAvatars={4} presence={presence} />}
      validation={
        validationMarkers.length > 0 && <FormFieldValidationStatus fontSize={1} markers={markers} />
      }
    >
      {changeIndicator ? <ChangeIndicator>{children}</ChangeIndicator> : children}
    </BaseFormField>
  )
}
