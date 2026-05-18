import {type SanityDocument, type PortableTextBlock} from '@sanity/types'

import {type VARIANT_DOCUMENTS_PATH} from './store/constants'

export interface SystemVariant extends SanityDocument {
  _type: 'system.variant'
  _id: `${typeof VARIANT_DOCUMENTS_PATH}.${string}`
  conditions: Record<string, string>
  priority: number // defaults to 0.
  metadata?: {
    description: PortableTextBlock[]
    [key: string]: unknown // <-- Here we can store anything useful for the UI
  }
}
