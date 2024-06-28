import {type SanityDocument} from '@sanity/types'

export interface BundleDocument extends SanityDocument {
  _type: 'bundle'
  title: string
  description?: string
  color?: string
  icon?: string
  authorId: string
}
