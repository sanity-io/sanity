import {type PortableTextBlock} from '@sanity/types'

export const LANDING_PAGE_ID = 'demo-coffee-landing'

const PRODUCT_CARD_PROJECTION = `{
  _id,
  _type,
  title,
  "slug": slug.current,
  excerpt,
  price,
  discount,
  "imageUrl": image.asset->url,
  origin->{_id, name, region, "imageUrl": image.asset->url}
}`

export const LANDING_PAGE_QUERY = `{
  "page": *[_type == "demoCoffeeLandingPage" && _id == $id][0]{
    _id,
    _type,
    title,
    sections[]{
      _key,
      _type,
      headline,
      subheadline,
      title,
      ctaLabel,
      heading,
      tagline,
      body,
      buttonLabel,
      "imageUrl": image.asset->url,
      promo->{_id, title, tagline, ctaLabel},
      products[]->${PRODUCT_CARD_PROJECTION},
      origins[]->{_id, name, region, "imageUrl": image.asset->url}
    }
  },
  "latestProducts": *[_type == "demoCoffeeProduct"] | order(_createdAt desc)[0...6]${PRODUCT_CARD_PROJECTION}
}`

export const PRODUCT_DETAIL_QUERY = `*[_type == "demoCoffeeProduct" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  excerpt,
  price,
  discount,
  description,
  "imageUrl": image.asset->url,
  origin->{_id, name, region, "imageUrl": image.asset->url},
  promo->{_id, title, tagline, ctaLabel},
  "relatedProducts": *[_type == "demoCoffeeProduct" && slug.current != $slug] | order(_createdAt desc)[0...3]${PRODUCT_CARD_PROJECTION}
}`

export interface CoffeeOrigin {
  _id?: string
  name?: string
  region?: string
  imageUrl?: string
}

export interface CoffeePromo {
  _id?: string
  title?: string
  tagline?: string
  ctaLabel?: string
}

export interface CoffeeProductCard {
  _id: string
  _type?: string
  title?: string
  slug?: string
  excerpt?: string
  price?: number
  discount?: number
  imageUrl?: string
  origin?: CoffeeOrigin
}

export interface LandingSection {
  _key: string
  _type: string
  headline?: string
  subheadline?: string
  title?: string
  ctaLabel?: string
  heading?: string
  tagline?: string
  body?: PortableTextBlock[] | string
  buttonLabel?: string
  imageUrl?: string
  promo?: CoffeePromo
  products?: CoffeeProductCard[]
  origins?: CoffeeOrigin[]
}

export interface LandingPage {
  _id: string
  _type: string
  title?: string
  sections?: LandingSection[]
}

export interface LandingPageQueryResult {
  page: LandingPage | null
  latestProducts: CoffeeProductCard[]
}

export interface CoffeeProductDetail extends CoffeeProductCard {
  description?: PortableTextBlock[]
  promo?: CoffeePromo
  relatedProducts?: CoffeeProductCard[]
}
