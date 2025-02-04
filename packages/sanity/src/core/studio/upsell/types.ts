import {type PortableTextBlock} from '@sanity/types'

/**
 * @beta
 * @hidden
 */
export interface UpsellData {
  _createdAt: string
  _id: string
  _rev: string
  _type: string
  _updatedAt: string
  id: string
  image: {
    asset: {
      url: string
      altText: string | null
    }
  }
  descriptionText: PortableTextBlock[]
  ctaButton: {
    text: string
    url: string
  }
  secondaryButton: {
    url: string
    text: string
  }
}
