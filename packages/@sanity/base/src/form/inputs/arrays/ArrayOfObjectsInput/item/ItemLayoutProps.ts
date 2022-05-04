import {ValidationMarker, SchemaType} from '@sanity/types'
import React from 'react'
import {FormFieldPresence} from '../../../../../presence'

export interface ItemLayoutProps {
  isSortable: boolean
  readOnly?: boolean
  index: number
  value: {_key: string; _ref?: string}
  type?: SchemaType // note: type might be undefined here if the value doesn't have a matching schema type definition
  insertableTypes?: SchemaType[]
  onClick?: () => void
  onFocus?: (event: React.FocusEvent) => void
  onRemove: () => void
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void
  presence: FormFieldPresence[]
  validation?: ValidationMarker[]
}
