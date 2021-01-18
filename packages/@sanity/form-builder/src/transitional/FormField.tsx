// This is transitional in order to track usage of the FormField part from within the form-builder package
// in order to ease migration towards a part-less studio
import React from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {Marker} from '@sanity/types'
import {FormFieldPart} from '../legacyParts'

interface Props {
  label?: string
  description?: string
  level?: number
  children?: React.ReactNode
  labelFor?: string
  markers?: Marker[]
  presence?: FormFieldPresence[]
  changeIndicator?: boolean
}

export function FormField(props: Props) {
  return <FormFieldPart {...props} />
}
