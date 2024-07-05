import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'

export interface BundleDocument extends SanityDocument {
  _type: 'bundle'
  title: string
  name: string
  description?: string
  hue?: ColorHueKey
  icon?: IconSymbol
  authorId: string
  publishedAt?: string
}
