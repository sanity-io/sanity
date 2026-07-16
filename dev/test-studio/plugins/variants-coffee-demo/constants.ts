/**
 * The query-API parameter that selects a variant when fetching content.
 *
 * `@sanity/client` does not support passing a variant with queries yet (and the studio client
 * injects its own perspective), so the demo hand-rolls the request with plain `fetch` (see
 * `useCoffeeQuery.ts`). Once client support lands, the hook collapses to
 * `client.fetch(query, params, {variant})` (or whatever the final client API is).
 *
 * If the deployed API expects a different parameter name, change it HERE — single source.
 */
export const VARIANT_QUERY_PARAM = 'variant'

/** Experimental API version used while variants are in development (same as the studio's variants client). */
export const DEMO_API_VERSION = 'X'

const PRODUCT_CARD_PROJECTION = `{
  _id,
  title,
  excerpt,
  price,
  discount,
  "imageUrl": image.asset->url,
  origin->{name, region, "imageUrl": image.asset->url},
  promo->{title, tagline, ctaLabel}
}`

/** Latest products for the shop listing page. Dereferences origin and promo in one query. */
export const LATEST_PRODUCTS_QUERY = `*[_type == "demoCoffeeProduct"] | order(_createdAt desc) [0...12] ${PRODUCT_CARD_PROJECTION}`

/** A single product for the details page, including description and a carousel of other products. */
export const PRODUCT_DETAIL_QUERY = `*[_type == "demoCoffeeProduct" && _id == $id][0] {
  _id,
  title,
  excerpt,
  price,
  discount,
  "imageUrl": image.asset->url,
  description,
  origin->{name, region, "imageUrl": image.asset->url},
  promo->{title, tagline, ctaLabel},
  "latestProducts": *[_type == "demoCoffeeProduct" && _id != $id] | order(_createdAt desc) [0...3] {
    _id,
    title,
    price,
    discount,
    "imageUrl": image.asset->url
  }
}`

export interface CoffeePromo {
  title?: string
  tagline?: string
  ctaLabel?: string
}

export interface CoffeeOrigin {
  name?: string
  region?: string
  imageUrl?: string
}

export interface CoffeeProductListItem {
  _id: string
  title?: string
  excerpt?: string
  price?: number
  discount?: number
  imageUrl?: string
  origin?: CoffeeOrigin
  promo?: CoffeePromo
}

export interface CoffeeProductCarouselItem {
  _id: string
  title?: string
  price?: number
  discount?: number
  imageUrl?: string
}

export interface CoffeeProductDetail extends CoffeeProductListItem {
  description?: unknown[]
  latestProducts?: CoffeeProductCarouselItem[]
}
