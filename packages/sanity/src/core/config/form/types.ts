/**
 * @hidden
 * @beta */

import {ComponentType} from 'react'
import {PreviewProps} from '../../components'
import {InputProps, FieldProps, ItemProps, BlockProps, BlockAnnotationProps} from '../../form'

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
  preview?: ComponentType<PreviewProps>
}
