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
    // eslint-disable-next-line camelcase
    __experimental_search?: {path: string | string[]; weight?: number; mapWith?: string}[]
  }[]

  dataset: string
  projectId: string
  studioUrl?: (document: {id: string; type?: string}) => string | null
  tokenId?: string
  options?: ReferenceOptions
}
