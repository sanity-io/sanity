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
  } | null
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

/**
 * The settled outcome of an upsell data request: the data, or `hasError` when the request failed
 * or returned nothing. Never both.
 *
 * @internal
 */
export interface UpsellDataResult {
  upsellData: UpsellData | null
  hasError: boolean
}
