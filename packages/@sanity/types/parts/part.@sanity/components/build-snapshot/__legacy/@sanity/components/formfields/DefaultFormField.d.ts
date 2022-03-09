import type React from 'react'
import type {ValidationMarker} from '_self_'
import type {FormFieldPresence} from '../../../../presence'
import type {ChangeIndicatorContextProvidedProps} from '../../../../change-indicators'
interface DefaultFormFieldProps {
  label?: string
  className?: string
  inline?: boolean
  description?: string
  level?: number
  children?: React.ReactNode
  wrapped?: boolean
  labelFor?: string
  validation?: ValidationMarker[]
  presence?: FormFieldPresence[]
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
}
declare const _default: React.NamedExoticComponent<DefaultFormFieldProps>
export default _default
