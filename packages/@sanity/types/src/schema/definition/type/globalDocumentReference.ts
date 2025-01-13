import {type ComponentType} from 'react'

import {type PreviewConfig} from '../../preview'
import {type BaseSchemaDefinition} from './common'
import {type ReferenceOptions} from './reference'

/** @public */
export interface GlobalDocumentReferenceDefinition extends BaseSchemaDefinition {
  type: 'globalDocumentReference'
  weak?: boolean
  to: {
    type: string
    title?: string
    icon?: ComponentType
    preview?: PreviewConfig
  }[]

  resourceType: string
  resourceId: string
  options?: ReferenceOptions

  studioUrl?: (document: {id: string; type?: string}) => string | null
}
