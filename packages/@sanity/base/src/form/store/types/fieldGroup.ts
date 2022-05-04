import React from 'react'

export interface FieldGroup {
  name: string
  selected?: boolean
  disabled?: boolean
  title?: string
  icon?: React.ComponentType
}
