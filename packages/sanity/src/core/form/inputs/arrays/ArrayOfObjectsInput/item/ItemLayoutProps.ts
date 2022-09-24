import {NodeValidation, SchemaType} from '@sanity/types'
import React from 'react'
import {FormFieldPresence} from '../../../../../presence'
import {RenderPreviewCallback} from '../../../../types'

export interface ItemLayoutProps {
  index: number
  insertableTypes?: SchemaType[]
  isSortable: boolean
  onClick?: () => void
  onFocus?: (event: React.FocusEvent) => void
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void
  onRemove: () => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  renderPreview: RenderPreviewCallback
  type?: SchemaType // note: type might be undefined here if the value doesn't have a matching schema type definition
  validation?: NodeValidation[]
  value: {_key: string; _ref?: string}
}
