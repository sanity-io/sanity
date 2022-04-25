import {ComponentType} from 'react'

export interface FieldGroup {
  name: string
  title?: string
  icon?: ComponentType<void>
  default?: boolean
  selected?: boolean
  disabled?: boolean
}
