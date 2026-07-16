import {type DocumentSystem} from '@sanity/types'
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

/** Repeated query parameter for condition-based variant resolution (`key:value` per entry). */
export const VARIANT_CONDITION_QUERY_PARAM = 'variantCondition'

export type VariantQueryMode = 'variant-id' | 'variant-conditions'

export function formatVariantConditionParam(key: string, value: string): string {
  return `${key}:${value}`
}

export function getVariantConditionEntries(conditions: Record<string, string> = {}) {
  return Object.entries(conditions)
    .map(([key, value]) => ({key: key.trim(), value: value.trim()}))
    .filter(({key, value}) => key && value)
    .map(({key, value}) => ({
      key,
      value,
      param: formatVariantConditionParam(key, value),
    }))
}

/** Experimental API version used while variants are in development (same as the studio's variants client). */
export const DEMO_API_VERSION = 'X'

const PRODUCT_CARD_PROJECTION = `{
  _id,
  _originalId,
  _system,
  title,
  excerpt,
  price,
  discount,
  "imageUrl": image.asset->url,
  origin->{_id, _originalId, _system, name, region, "imageUrl": image.asset->url},
  promo->{_id, _originalId, _system, title, tagline, ctaLabel}
}`

/** Latest products for the shop listing page. Dereferences origin and promo in one query. */
export const LATEST_PRODUCTS_QUERY = `*[_type == "demoCoffeeProduct"] | order(_createdAt desc) [0...12] ${PRODUCT_CARD_PROJECTION}`

/** A single product for the details page, including description and a carousel of other products. */
export const PRODUCT_DETAIL_QUERY = `*[_type == "demoCoffeeProduct" && _id == $id][0] {
  _id,
  _originalId,
  _system,
  title,
  excerpt,
  price,
  discount,
  "imageUrl": image.asset->url,
  description,
  origin->{_id, _originalId, _system, name, region, "imageUrl": image.asset->url},
  promo->{_id, _originalId, _system, title, tagline, ctaLabel},
  "latestProducts": *[_type == "demoCoffeeProduct" && _id != $id] | order(_createdAt desc) [0...3] {
    _id,
    _originalId,
    _system,
    title,
    price,
    discount,
    "imageUrl": image.asset->url
  }
}`

export interface CoffeePromo {
  _id?: string
  _originalId?: string
  _system?: Partial<DocumentSystem>
  title?: string
  tagline?: string
  ctaLabel?: string
}

export interface CoffeeOrigin {
  _id?: string
  _originalId?: string
  _system?: Partial<DocumentSystem>
  name?: string
  region?: string
  imageUrl?: string
}

export interface CoffeeProductListItem {
  _id: string
  _originalId?: string
  _system?: Partial<DocumentSystem>
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
  _originalId?: string
  _system?: Partial<DocumentSystem>
  title?: string
  price?: number
  discount?: number
  imageUrl?: string
}

export interface CoffeeProductDetail extends CoffeeProductListItem {
  description?: unknown[]
  latestProducts?: CoffeeProductCarouselItem[]
}
