import React from 'react'

export interface FormFieldGroup {
  name: string
  selected?: boolean
  disabled?: boolean
  title?: string
  icon?: React.ComponentType
}
