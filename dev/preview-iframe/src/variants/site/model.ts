import {stegaClean} from '@sanity/client/stega'

// The data of the Nordic Books site. Documents carry only `title`, `subtitle` and `blurb` (seed/nordic-books.json).
// DERIVED, not stored: the author and the year are read from the subtitle ("By Maren Halvorsen · 2021"), the way the
// seed writes it. Documents whose subtitle does not follow that form simply have no author or year.
// FIXTURE: everything in VARIANT_COPY, CAMPAIGNS and the German strings is site copy that lives in this file, not in
// the dataset (the dataset has no hero, tagline, price or image fields). Covers are generated placeholders.

export interface Book {
  _id: string
  _type: string
  title?: string
  subtitle?: string
  blurb?: string
  highlights?: string[]
  promo?: string
  badge?: string
  cta?: string
}

export interface Parsed {
  book: Book
  title: string
  author?: string
  year?: string
  note?: string
  /** 0 to 359, from the id: the colour of the placeholder cover. */
  hue: number
}

const SUBTITLE = /^By (.+?) · (\d{4})$/

function hash(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}

export function parse(book: Book): Parsed {
  const subtitle = stegaClean(book.subtitle ?? '')
  const match = SUBTITLE.exec(subtitle)
  return {
    book,
    title: stegaClean(book.title ?? 'Untitled'),
    author: match?.[1],
    year: match?.[2],
    note: match ? undefined : subtitle || undefined,
    hue: hash(book._id) % 360,
  }
}

export type Lang = 'en' | 'de'

export interface VariantCopy {
  /** Shown quietly in the header chip. */
  label: string
  hero: string
  promo: string
}

// FIXTURE: copy per variant definition id. Composite ids (audience + locale) fall back to the audience entry and the language.
export const VARIANT_COPY: Record<string, VariantCopy> = {
  base: {label: 'Everyone', hero: 'Books from the fjords and the islands', promo: 'A small shop for northern writing, ordered by hand.'},
  'aud-members': {label: 'Members', hero: 'The members’ shelf', promo: 'Members read first: early access to every new list.'},
  'aud-first-time-visitors': {label: 'First-time visitors', hero: 'A good first book', promo: 'New here? Start with the books our readers keep recommending.'},
  'aud-lapsed-customers': {label: 'Lapsed customers', hero: 'Welcome back', promo: 'It has been a while. Here is what changed on the shelves.'},
  'aud-loyal-customers': {label: 'Loyal customers', hero: 'Thank you for reading with us', promo: 'Loyal readers see every new edition first.'},
  'aud-returning-visitors': {label: 'Returning visitors', hero: 'Pick up where you left off', promo: 'Your next book is probably on this shelf.'},
  'aud-students': {label: 'Students', hero: 'For the reading list', promo: 'Student editions are marked on the shelf.'},
  'aud-nordic-region': {label: 'Nordic region', hero: 'From the north, for the north', promo: 'Delivery inside the Nordics is handled by our own van.'},
}

const GERMAN = {
  nav: {home: 'Start', list: 'Katalog', campaign: 'Aktion', about: 'Über uns'},
  allBooks: 'Alle Bücher',
  featured: 'Ausgewählt',
  catalogue: 'Katalog',
  filters: 'Filter',
  year: 'Jahr',
  author: 'Autorin oder Autor',
  all: 'Alle',
  noMatch: 'Kein Buch passt zu diesem Filter.',
  back: 'Zurück zum Katalog',
  note: 'Hinweis der Redaktion',
  related: 'Mehr davon',
  editions: 'Ausgabe',
  campaign: 'Aktion',
  hero: 'Bücher von den Fjorden und den Inseln',
  promo: 'Ein kleiner Laden für nordische Literatur, von Hand sortiert.',
  viewing: 'Ansicht',
  viewingVersion: (label: string) => `Sie sehen die Version: ${label}`,
  highlights: 'In dieser Ausgabe',
  defaultCta: 'In den Warenkorb',
}
const ENGLISH: typeof GERMAN = {
  nav: {home: 'Home', list: 'Catalogue', campaign: 'Campaign', about: 'About'},
  allBooks: 'All books',
  featured: 'Featured',
  catalogue: 'Catalogue',
  filters: 'Filters',
  year: 'Year',
  author: 'Author',
  all: 'All',
  noMatch: 'No book matches this filter.',
  back: 'Back to the catalogue',
  note: 'Editor’s note',
  related: 'More like this',
  editions: 'Edition',
  campaign: 'Campaign',
  hero: '',
  promo: '',
  viewing: 'Viewing',
  viewingVersion: (label: string) => `You are viewing the ${label} version`,
  highlights: 'In this edition',
  defaultCta: 'Add to cart',
}
export const strings = (lang: Lang) => (lang === 'de' ? GERMAN : ENGLISH)

/** The audience part of a variant id: "aud-loyal-customers__loc-de-de" -> "aud-loyal-customers". */
const audienceOf = (variant?: string) => variant?.split('__').find((part) => part.startsWith('aud-'))

export function copyFor(variant: string | undefined, lang: Lang): VariantCopy {
  const audience = audienceOf(variant)
  const entry = (audience && VARIANT_COPY[audience]) || VARIANT_COPY.base
  if (lang === 'de' && !audience) return {label: 'de-DE', hero: GERMAN.hero, promo: GERMAN.promo}
  return {...entry, label: lang === 'de' && audience ? `${entry.label} · de-DE` : entry.label}
}

export const langOf = (variant?: string): Lang => (variant?.includes('loc-de-de') ? 'de' : 'en')

// FIXTURE: the campaign the page shows follows the release that is previewed, or the variant (campaign dimension).
const CAMPAIGNS: Record<string, {name: string; line: string; lineDe: string}> = {
  rBlackFriday: {name: 'Black Friday', line: 'One day, the whole northern list at the shop’s own pace.', lineDe: 'Ein Tag, die ganze nordische Liste in unserem Tempo.'},
  rHalloween: {name: 'Halloween', line: 'Long nights, short stories.', lineDe: 'Lange Nächte, kurze Geschichten.'},
  rUndecided: {name: 'Autumn Catalogue Refresh', line: 'The autumn list, reshuffled.', lineDe: 'Die Herbstliste, neu gemischt.'},
}
const DEFAULT_CAMPAIGN = {name: 'Autumn Catalogue Refresh', line: 'The autumn list, reshuffled.', lineDe: 'Die Herbstliste, neu gemischt.'}

export function campaignFor(perspective: unknown, variant: string | undefined, lang: Lang) {
  const stack = Array.isArray(perspective) ? perspective.map(String) : [String(perspective)]
  const release = stack.find((p) => p in CAMPAIGNS)
  const picked = release ? CAMPAIGNS[release] : variant?.includes('black-friday') ? CAMPAIGNS.rBlackFriday : variant?.includes('halloween') ? CAMPAIGNS.rHalloween : DEFAULT_CAMPAIGN
  return {name: picked.name, line: lang === 'de' ? picked.lineDe : picked.line}
}
