import {type ComponentType} from 'react'

import {type PreviewProps} from '../../components/previews'
import {type FieldProps, type InputProps, type ItemProps} from '../../form/types'
import {type BlockAnnotationProps, type BlockProps} from '../../form/types/blockProps'

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
