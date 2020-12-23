import {Marker, SchemaType} from '@sanity/types'
import React from 'react'
import {FormFieldPresence} from '@sanity/base/lib/presence'

export interface ItemLayoutProps {
  isSortable: boolean
  readOnly: boolean
  value: {_key?: string; _ref?: string}
  type?: SchemaType
  onClick?: () => void
  onFocus: () => void
  onRemove: () => void
  onKeyPress: (event: React.KeyboardEvent<any>) => void
  presence: FormFieldPresence[]
  validation: Marker[]
}
