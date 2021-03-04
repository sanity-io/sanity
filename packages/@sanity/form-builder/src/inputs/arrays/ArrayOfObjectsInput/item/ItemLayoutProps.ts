import {Marker, SchemaType} from '@sanity/types'
import React from 'react'
import {FormFieldPresence} from '@sanity/base/lib/presence'

export interface ItemLayoutProps {
  isSortable: boolean
  readOnly: boolean
  value: {_key?: string; _ref?: string}
  type?: SchemaType // note: type might be undefined here if the value doesn't have a matching schema type definition
  onClick?: () => void
  onFocus?: () => void
  onRemove: () => void
  onKeyPress: (event: React.KeyboardEvent<any>) => void
  presence: FormFieldPresence[]
  validation: Marker[]
}
