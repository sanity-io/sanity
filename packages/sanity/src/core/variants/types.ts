import {type SanityDocument, type PortableTextBlock} from '@sanity/types'

import {type VARIANT_DOCUMENT_TYPE, type VARIANT_DOCUMENTS_PATH} from './store/constants'

/**
 * @internal
 */
export type VariantId = `${typeof VARIANT_DOCUMENTS_PATH}.${string}`

export interface SystemVariant extends SanityDocument {
  _type: typeof VARIANT_DOCUMENT_TYPE
  _id: VariantId
  name?: string
  conditions: Record<string, string>
  priority: number // defaults to 0.
  metadata?: {
    title?: string
    description?: PortableTextBlock[]
    [key: string]: unknown // <-- Here we can store anything useful for the UI
  }
}

/**
 * @internal
 */
export type EditableSystemVariant = Pick<
  SystemVariant,
  '_id' | '_type' | 'conditions' | 'priority' | 'metadata'
>
