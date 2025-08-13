import {type ComponentType} from 'react'

import type {PreviewProps} from '../../components/previews/types'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type PortableTextPluginsProps,
} from '../../form/types/blockProps'
import type {FieldProps} from '../../form/types/fieldProps'
import type {InputProps} from '../../form/types/inputProps'
import type {ItemProps} from '../../form/types/itemProps'

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
