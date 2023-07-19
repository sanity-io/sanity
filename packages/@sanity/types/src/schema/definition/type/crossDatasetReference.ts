import {ComponentType} from 'react'
import {PreviewConfig} from '../../preview'
import {BaseSchemaDefinition} from './common'
import {ReferenceOptions} from './reference'

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
     * @deprecated Configuring search is no longer supported
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
}
