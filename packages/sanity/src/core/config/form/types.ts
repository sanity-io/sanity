/**
 * @hidden
 * @beta */

import {ComponentType} from 'react'
import {PreviewProps} from '../../components'
import {InputProps, FieldProps, ItemProps, BlockProps, BlockAnnotationProps} from '../../form'

/** @beta */
export interface FormLayoutProps {
  documentId: string
  documentType: string
  renderDefault: (props: FormLayoutProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
export interface FormComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  field?: ComponentType<FieldProps>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<InputProps>
  item?: ComponentType<ItemProps>
  layout?: ComponentType<FormLayoutProps>
  preview?: ComponentType<PreviewProps>
}
