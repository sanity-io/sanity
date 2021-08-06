import React from 'react'
import {Marker} from '_self_'
import {FormFieldPresence} from '../../../../presence'
import {ChangeIndicatorContextProvidedProps} from '../../../../change-indicators'
interface DefaultFormFieldProps {
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
declare const _default: React.NamedExoticComponent<DefaultFormFieldProps>
export default _default
