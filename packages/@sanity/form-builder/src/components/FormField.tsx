import FormFieldPart from 'part:@sanity/components/formfields/default'
import {FormFieldPresence} from '@sanity/base/presence'
import React from 'react'
import {Marker} from '@sanity/types'
import {ChangeIndicatorContextProvidedProps} from '@sanity/base/lib/change-indicators'

interface Props {
  label?: string
  className?: string
  inline?: boolean
  description?: string
  level?: number
  children?: React.ReactNode
  wrapped?: boolean
  labelFor?: string
  markers?: Marker[]
  presence?: FormFieldPresence[]
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
}

export function FormField(props: Props) {
  return <FormFieldPart {...props} />
}
