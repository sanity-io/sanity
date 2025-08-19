import {type ComponentType} from 'react'

import {type CrossDatasetReferenceValue} from '../../../crossDatasetReference/types'
import {type PreviewConfig} from '../../preview'
import {
  type BlockAnnotationProps,
  type BlockProps,
  type ObjectFieldProps,
  type ObjectItem,
  type ObjectItemProps,
  type PreviewProps,
} from '../props'
import {type BaseSchemaDefinition} from './common'
import {type ReferenceOptions} from './reference'

/**
 *
 * @hidden
 * @beta
 */
export interface CrossDatasetReferenceComponents {
  annotation?: ComponentType<BlockAnnotationProps>
  block?: ComponentType<BlockProps>
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<CrossDatasetReferenceValue>>
  inlineBlock?: ComponentType<BlockProps>
  input?: ComponentType<CrossDatasetReferenceDefinition>
  item?: ComponentType<ObjectItemProps<CrossDatasetReferenceValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface CrossDatasetReferenceDefinition extends BaseSchemaDefinition {
  type: 'crossDatasetReference'
  weak?: boolean
  to: {
    type: string
    title?: string
    icon?: ComponentType
    preview?: PreviewConfig

    /**
     * @deprecated Unused. Configuring search is no longer supported.
     */
    __experimental_search?: {path: string | string[]; weight?: number; mapWith?: string}[]
  }[]

  dataset: string
  studioUrl?: (document: {id: string; type?: string}) => string | null
  tokenId?: string
  options?: ReferenceOptions

  /**
   * @deprecated Cross-project references are no longer supported, only cross-dataset
   */
  projectId?: string
  /**
   *
   * @hidden
   * @beta
   */
  components?: CrossDatasetReferenceComponents
}
