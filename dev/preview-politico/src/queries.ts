export const HOME_PAGE_ID = 'politico-home'

// Localized via the regular internationalizedArray plugin (not Content Variants) —
// $lang picks the requested locale, falling back to English when untranslated.
function localized(field: string): string {
  return `coalesce(${field}[language == $lang][0].value, ${field}[language == "en"][0].value)`
}

const ARTICLE_CARD_PROJECTION = `{
  _id,
  _type,
  "section": section,
  "kicker": ${localized('kicker')},
  "headline": ${localized('headline')},
  "dek": ${localized('dek')},
  "slug": slug.current,
  byline,
  publishedAt,
  "imageUrl": heroImage.asset->url
}`

export const HOME_PAGE_QUERY = `{
  "page": *[_type == "politicoHomePage" && _id == $id][0]{
    _id,
    _type,
    title,
    "featured": featuredArticles[]->${ARTICLE_CARD_PROJECTION}
  },
  "latestArticles": *[_type == "politicoArticle"] | order(_createdAt desc)[0...6]${ARTICLE_CARD_PROJECTION}
}`

export const ARTICLE_DETAIL_QUERY = `*[_type == "politicoArticle" && slug.current == $slug][0]{
  _id,
  _type,
  section,
  byline,
  publishedAt,
  "kicker": ${localized('kicker')},
  "headline": ${localized('headline')},
  "dek": ${localized('dek')},
  "imageUrl": heroImage.asset->url,
  "body": ${localized('body')},
  contextBox{
    "heading": ${localized('heading')},
    "body": ${localized('body')}
  },
  sponsoredInsert->{
    _id,
    name,
    "headline": ${localized('headline')},
    "body": ${localized('body')},
    "ctaLabel": ${localized('ctaLabel')}
  },
  memberAnalysis{
    "heading": ${localized('heading')},
    "body": ${localized('body')},
    "teaser": ${localized('teaser')}
  }
}`

export interface ArticleCard {
  _id: string
  _type?: string
  section?: string
  kicker?: string
  headline?: string
  dek?: string
  slug?: string
  byline?: string
  publishedAt?: string
  imageUrl?: string
}

export interface HomePage {
  _id: string
  _type: string
  title?: string
  featured?: ArticleCard[]
}

export interface HomePageQueryResult {
  page: HomePage | null
  latestArticles: ArticleCard[]
}

export interface Sponsor {
  _id?: string
  name?: string
  headline?: string
  body?: string
  ctaLabel?: string
}

export interface MemberAnalysis {
  heading?: string
  body?: string
  teaser?: string
}

export interface ContextBox {
  heading?: string
  body?: string
}

export interface ArticleDetail {
  _id: string
  _type?: string
  section?: string
  byline?: string
  publishedAt?: string
  kicker?: string
  headline?: string
  dek?: string
  imageUrl?: string
  body?: string
  contextBox?: ContextBox
  sponsoredInsert?: Sponsor
  memberAnalysis?: MemberAnalysis
}
