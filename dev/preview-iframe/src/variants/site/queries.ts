// The GROQ of the site, one query per route kind. Every query dereferences with `->`, so a weak reference to a draft-only
// document (or a deleted one) comes back `null` and the page skips it. Perspective and variant are applied by the Studio's
// loader, exactly as for the plain book fields.
const TYPES = `["book", "bookLive"]`
const REFS = `"author": author->{_id, _type, name}, "series": inSeries->{_id, _type, title}, "publisher": publisher->{_id, _type, name}, "publisherRef": publisher._ref`
const CARD = `_id, _type, title, subtitle, blurb, highlights, promo, badge, cta, ${REFS}`
const BOOKS = `*[_type in ${TYPES}] | order(title asc)`

export interface RouteQuery {
  query: string
  params: Record<string, string>
}

export const LIST = `${BOOKS} {${CARD}}`

const BOOK = `*[_type in ${TYPES} && _id == $id][0] {${CARD},
  "related": relatedBooks[]->{${CARD}},
  notes[]{..., children[]{..., _type == "authorMention" => {"author": @->{_id, _type, name}}}}}`
const AUTHORS = `*[_type == "author"] | order(name asc) {_id, _type, name, bio, born, "town": homeTown->{_id, _type, name, country}, "bookCount": count(*[_type in ${TYPES} && author._ref == ^._id])}`
const AUTHOR = `*[_type == "author" && _id == $id][0] {_id, _type, name, bio, born, "town": homeTown->{_id, _type, name, country}, "books": *[_type in ${TYPES} && author._ref == $id] | order(title asc) {${CARD}}}`
const SERIES_LIST = `*[_type == "series"] | order(title asc) {_id, _type, title, blurb, "bookCount": count(*[_type in ${TYPES} && inSeries._ref == ^._id])}`
const SERIES = `*[_type == "series" && _id == $id][0] {_id, _type, title, blurb, "books": *[_type in ${TYPES} && inSeries._ref == $id] | order(title asc) {${CARD}}}`
const PUBLISHER = `*[_type == "publisher" && _id == $id][0] {_id, _type, name, about, "hq": headquarters->{_id, _type, name, country}, "books": *[_type in ${TYPES} && publisher._ref == $id] | order(title asc) {${CARD}}}`

/** `?route=` value to the query that feeds it. `fm:` is handled by the page itself. */
export function queryFor(route: string): RouteQuery {
  const [kind, id = ''] = route.split(/:(.*)/s)
  switch (kind) {
    case 'book':
      return {query: BOOK, params: {id}}
    case 'authors':
      return {query: AUTHORS, params: {}}
    case 'author':
      return {query: AUTHOR, params: {id}}
    case 'series':
      return id ? {query: SERIES, params: {id}} : {query: SERIES_LIST, params: {}}
    case 'publisher':
      return {query: PUBLISHER, params: {id}}
    default:
      return {query: LIST, params: {}} // home, list, campaign, about, anything unknown
  }
}
