import {type ComponentType} from 'react'

import {type PreviewProps} from '../../components'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type FieldProps,
  type InputProps,
  type ItemProps,
  type PortableTextPluginsProps,
} from '../../form'

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
  portableText?: {
    plugins?: ComponentType<PortableTextPluginsProps>
  }
}
