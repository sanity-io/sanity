// Seeds the localization plugin scenario (@sanity/document-internationalization): Danish, Swedish and Norwegian versions of the Nordic Books content.
//   - sets language `en` on the originals (published, drafts and every version, so a variant still compares equal to its base)
//   - creates `<id>-da`, `<id>-sv`, `<id>-nb` (published) with the text translated (seed/translations.json; names, places and publishers stay)
//   - joins each set with a `translation.metadata` document (id `meta-<id>`)
// Types: book, bookLive, series, publisher, place. Not the authors (people's names) and not the E9 fixtures (test data the journeys count).
// Idempotent: node seed/seed-translations.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const dictionary = JSON.parse(readFileSync(new URL('./translations.json', import.meta.url), 'utf8')) as {
  langs: string[]
  by: string[]
  strings: Record<string, Record<string, string>>
}
const TYPES = ['book', 'bookLive', 'series', 'publisher', 'place']
// A translation made by this script has an id that ends in a language; an original never does (so a re-run never translates a translation).
const isTranslationId = (id: string) => /-(da|sv|nb)$/.test(id)
const SKIP_KEYS = new Set(['_type', '_key', '_ref', '_weak', 'language'])
const key = () => Math.random().toString(36).slice(2, 14)

/** A string in a language: the dictionary, or "By <name> · <year>" with the word for by; anything else (names, styles) stays. */
function say(text: string, lang: string): string {
  const hit = dictionary.strings[text]?.[lang]
  if (hit) return hit
  const by = /^By (.+)$/.exec(text)
  if (by) return `${dictionary.by[dictionary.langs.indexOf(lang)]} ${by[1]}`
  return text
}
function translate(value: unknown, lang: string, name = ''): unknown {
  if (typeof value === 'string') return SKIP_KEYS.has(name) ? value : say(value, lang)
  if (Array.isArray(value)) return value.map((item) => translate(item, lang, name))
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, translate(v, lang, k)]))
  return value
}

// 1. language `en` on every document of these types, in every bundle.
const all = (await x.fetch(`*[_type in $types]{_id, _type, language}`, {types: TYPES})) as {_id: string; _type: string; language?: string}[]
const needEn = all.filter((d) => !isTranslationId(d._id) && d.language !== 'en')
let patched = 0
const skipped: string[] = []
// A document inside a scheduled release cannot be changed (and should not be): such a batch is retried one by one and those are left alone.
const setEn = (tx: ReturnType<typeof x.transaction>, d: {_id: string}) => tx.patch(d._id, (p) => p.set({language: 'en'}))
for (let i = 0; i < needEn.length; i += 40) {
  const batch = needEn.slice(i, i + 40)
  try {
    const tx = x.transaction()
    for (const d of batch) setEn(tx, d)
    await tx.commit()
    patched += batch.length
  } catch {
    for (const d of batch) {
      try {
        await setEn(x.transaction(), d).commit()
        patched++
      } catch {
        skipped.push(d._id)
      }
    }
  }
}
if (skipped.length) console.log(`left alone (in a scheduled release): ${skipped.join(', ')}`)
console.log(`language en: ${patched} patched`)

// 2. the translations and the metadata, from the published originals.
const bases = (
  (await x.fetch(`*[_type in $types && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]`, {types: TYPES})) as Record<string, any>[]
).filter((d) => !isTranslationId(d._id))
let created = 0
for (const base of bases) {
  const id = base._id as string
  const content = Object.fromEntries(Object.entries(base).filter(([k]) => !['_id', '_rev', '_createdAt', '_updatedAt', '_system'].includes(k)))
  const refs = [{language: 'en', _key: key(), _type: 'internationalizedArrayReferenceValue', value: {_type: 'reference', _ref: id}}]
  const tx = x.transaction()
  for (const lang of dictionary.langs) {
    const copy = {...(translate(content, lang) as Record<string, unknown>), _id: `${id}-${lang}`, language: lang}
    tx.createOrReplace(copy as any)
    refs.push({language: lang, _key: key(), _type: 'internationalizedArrayReferenceValue', value: {_type: 'reference', _ref: `${id}-${lang}`}})
    created++
  }
  tx.createOrReplace({_id: `meta-${id}`, _type: 'translation.metadata', schemaTypes: [base._type], translations: refs} as any)
  await tx.commit()
}
console.log(`translations: ${created} documents for ${bases.length} originals, ${bases.length} metadata documents`)

// 3. The same books the field-level way: ONE document per book with every language inside its fields (sanity-plugin-internationalized-array 5, items
//    `{_key, language, value}`), type bookFieldLevel, id `fl-<book id>`. From the published books only.
const strings = (en: unknown, valueType: string) =>
  ['en', ...dictionary.langs].map((lang) => ({_key: key(), _type: valueType, language: lang, value: lang === 'en' ? String(en ?? '') : say(String(en ?? ''), lang)}))
const books = bases.filter((d) => d._type === 'book')
for (const book of books) {
  await x.createOrReplace({
    _id: `fl-${book._id}`,
    _type: 'bookFieldLevel',
    title: strings(book.title, 'internationalizedArrayStringValue'),
    subtitle: book.subtitle ?? '',
    blurb: strings(book.blurb, 'internationalizedArrayTextValue'),
    cta: strings(book.cta ?? 'Add to cart', 'internationalizedArrayStringValue'),
  } as any)
}
console.log(`field-level books: ${books.length}`)
