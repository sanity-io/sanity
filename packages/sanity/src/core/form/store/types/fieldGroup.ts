import {type ComponentType} from 'react'

/**
 * @hidden
 * @beta */
export interface FormFieldGroup {
  name: string
  selected?: boolean
  disabled?: boolean
  title?: string
  icon?: ComponentType
}
