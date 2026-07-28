export const LANDING_PAGE_ID = 'demo-coffee-landing'

// Localized via the regular internationalizedArray plugin (not Content Variants) —
// $lang picks the requested locale, falling back to English when untranslated.
// Filtering on `language` (not `_key`) matches the plugin's v5 data shape.
function localized(field: string): string {
  return `coalesce(${field}[language == $lang][0].value, ${field}[language == "en"][0].value)`
}

const ORIGIN_PROJECTION = `{_id, name, "region": ${localized('region')}, "imageUrl": image.asset->url}`

const PRODUCT_CARD_PROJECTION = `{
  _id,
  _type,
  "title": ${localized('title')},
  "slug": slug.current,
  "excerpt": ${localized('excerpt')},
  price,
  discount,
  "imageUrl": image.asset->url,
  origin->${ORIGIN_PROJECTION}
}`

export const LANDING_PAGE_QUERY = `{
  "page": *[_type == "demoCoffeeLandingPage" && _id == $id][0]{
    _id,
    _type,
    title,
    sections[]{
      _key,
      _type,
      "headline": ${localized('headline')},
      "subheadline": ${localized('subheadline')},
      title,
      "ctaLabel": select(_type == "hero" => ${localized('ctaLabel')}, ctaLabel),
      "heading": ${localized('heading')},
      tagline,
      "body": select(_type == "cta" || _type == "story" => ${localized('body')}, body),
      "buttonLabel": ${localized('buttonLabel')},
      "imageUrl": image.asset->url,
      promo->{
        _id,
        "title": ${localized('title')},
        "tagline": ${localized('tagline')},
        "ctaLabel": ${localized('ctaLabel')}
      },
      products[]->${PRODUCT_CARD_PROJECTION},
      origins[]->${ORIGIN_PROJECTION}
    }
  },
  "latestProducts": *[_type == "demoCoffeeProduct"] | order(_createdAt desc)[0...6]${PRODUCT_CARD_PROJECTION}
}`

export const PRODUCT_DETAIL_QUERY = `*[_type == "demoCoffeeProduct" && slug.current == $slug][0]{
  _id,
  _type,
  "title": ${localized('title')},
  "slug": slug.current,
  "excerpt": ${localized('excerpt')},
  price,
  discount,
  "description": ${localized('description')},
  "imageUrl": image.asset->url,
  origin->${ORIGIN_PROJECTION},
  promo->{
    _id,
    "title": ${localized('title')},
    "tagline": ${localized('tagline')},
    "ctaLabel": ${localized('ctaLabel')}
  },
  sizeOptions[]{label, weightGrams, price},
  grindOptions,
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
  body?: string
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

export interface ProductSizeOption {
  label?: string
  weightGrams?: number
  price?: number
}

export interface CoffeeProductDetail extends CoffeeProductCard {
  description?: string
  promo?: CoffeePromo
  sizeOptions?: ProductSizeOption[]
  grindOptions?: string[]
  relatedProducts?: CoffeeProductCard[]
}
