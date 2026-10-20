// Seeds the reference fixtures for the multi-pane scenarios (E9) in variants-2-0. Idempotent: node seed/seed-refs.mts
//  places, publishers, series and authors (one per by-line found in the books), then references on every book version:
//   author        hard reference (several books point at one author: incoming references)
//   publisher     WEAK reference; book-lighthouse points at publisher-unpublished, which exists only as a draft (a weak reference to something unpublished)
//   inSeries      hard reference to a series
//   relatedBooks  an array mixing hard and weak references
//   notes         portable text with an inline reference to an author (authorMention)
//  author variants: Maren Halvorsen has a Members variant (published), Elif Demir a Returning visitors variant (published only),
//  Ines Marques a Members variant with a draft next to the published version, the rest none.
// Strings are kept: `subtitle` still reads "By Maren Halvorsen" next to the new `author` reference, and every id is unchanged.
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const dated = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: '2025-02-19', useCdn: false, token, perspective: 'raw'})
const body = (e: any) => JSON.stringify(e?.response?.body?.error ?? e?.message ?? e)
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const ref = (id: string, weak = false) => ({_type: 'reference', _ref: id, ...(weak ? {_weak: true} : {})})

// ------------------------------------------------------------------ places, publishers, series
const places = [['bergen', 'Bergen', 'Norway'], ['oslo', 'Oslo', 'Norway'], ['aarhus', 'Aarhus', 'Denmark'], ['malmo', 'Malmö', 'Sweden'], ['gothenburg', 'Gothenburg', 'Sweden']]
const publishers = [
  ['skerry-press', 'Skerry Press', 'Small-run coastal nonfiction.', 'place-bergen'],
  ['lantern-co', 'Lantern & Co', 'Literary fiction and essays.', 'place-oslo'],
  ['nordlys-forlag', 'Nordlys Forlag', 'Nordic classics in new editions.', 'place-aarhus'],
]
const seriesList = [['coastal-almanacs', 'Coastal Almanacs', 'Yearbooks of weather, tides and letters.'], ['small-hours', 'Small Hours', 'Short books for late evenings.'], ['field-guides', 'Field Guides', 'Practical guides, illustrated.']]
const tx = dated.transaction()
for (const [id, name, country] of places) tx.createOrReplace({_id: `place-${id}`, _type: 'place', name, country})
for (const [id, name, about, hq] of publishers) tx.createOrReplace({_id: `publisher-${id}`, _type: 'publisher', name, about, headquarters: ref(hq)})
for (const [id, title, blurb] of seriesList) tx.createOrReplace({_id: `series-${id}`, _type: 'series', title, blurb})
// A publisher that exists only as a draft: a weak reference to it points at something unpublished.
tx.createOrReplace({_id: 'drafts.publisher-unpublished', _type: 'publisher', name: 'Harbourlight (not yet published)', about: 'Announced, not published.', headquarters: ref('place-oslo', true)})
await tx.commit({visibility: 'sync'})

// ------------------------------------------------------------------ authors, from the by-lines
const rows: {_id: string; _type: string; subtitle?: string}[] = await x.fetch('*[_type in ["book","bookLive","e9Set","e9Case"]]{_id,_type,subtitle}')
const baseOf = (id: string) => id.split('.').at(-1) as string
const nameOf = (subtitle?: string) => subtitle?.match(/^(?:By|Af|Von|Par)\s+([^·]+?)(?:\s*·.*)?$/)?.[1]?.trim()
const authors = new Map<string, string>()
for (const r of rows) {
  const n = nameOf(r.subtitle)
  if (n && !authors.has(slug(n))) authors.set(slug(n), n)
}
const towns = ['place-bergen', 'place-oslo', 'place-aarhus', 'place-malmo', 'place-gothenburg']
const atx = dated.transaction()
let i = 0
for (const [id, name] of authors)
  atx.createOrReplace({_id: `author-${id}`, _type: 'author', name, bio: `${name} writes about the places and the weather in them.`, born: 1950 + ((i * 7) % 40), homeTown: ref(towns[i++ % towns.length], true)})
await atx.commit({visibility: 'sync'})
console.log(`authors: ${authors.size}`)

// ------------------------------------------------------------------ references on every version of every book
const book = (id: string) => rows.find((r) => r._id === id)
const groups = new Map<string, string[]>()
for (const r of rows) groups.set(baseOf(r._id), [...(groups.get(baseOf(r._id)) ?? []), r._id])
const baseIds = [...groups.keys()].filter((id) => rows.some((r) => r._id === id && r._type !== 'bookLive'))
let n = 0
let failed = 0
for (const [index, baseId] of baseIds.entries()) {
  const published = book(baseId)
  const name = nameOf(published?.subtitle ?? rows.find((r) => baseOf(r._id) === baseId && r.subtitle)?.subtitle)
  const set: Record<string, unknown> = {}
  if (name) set.author = ref(`author-${slug(name)}`)
  set.publisher = ref(baseId === 'book-lighthouse' ? 'publisher-unpublished' : `publisher-${publishers[index % 3][0]}`, true)
  set.inSeries = ref(`series-${seriesList[index % 3][0]}`)
  const others = baseIds.filter((o) => o !== baseId && rows.find((r) => r._id === o)?._type === 'book')
  if (published?._type === 'book' && others.length > 2)
    set.relatedBooks = [
      {_type: 'related', _key: 'r1', _ref: others[index % others.length]},
      {_type: 'relatedWeak', _key: 'r2', _ref: others[(index + 3) % others.length], _weak: true},
    ]
  if (name)
    set.notes = [
      {_type: 'block', _key: 'n1', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 'n1a', text: 'Written by ', marks: []}, {_type: 'authorMention', _key: 'n1m', _ref: `author-${slug(name)}`}, {_type: 'span', _key: 'n1b', text: ', who also appears in the other books of the series.', marks: []}],
      },
    ]
  for (const id of groups.get(baseId) ?? []) {
    try {
      await dated.patch(id).set(set).commit({visibility: 'async'})
      n++
    } catch (e) {
      failed++
      if (failed < 4) console.log('skipped', id, body(e).slice(0, 120))
    }
  }
}
console.log(`reference fields set on ${n} document versions (${failed} skipped, e.g. immutable scheduled releases)`)

// ------------------------------------------------------------------ author variants
async function variant(publishedId: string, variantId: string, bundleId: string, document: Record<string, unknown>, publish = false) {
  const create = {actionType: 'sanity.action.document.variant.create', publishedId, variantId, bundleId, document}
  const actions: unknown[] = [create]
  if (publish) actions.push({actionType: 'sanity.action.document.variant.publish', publishedId, variantId, bundleId})
  try {
    await x.action(actions as never, {tag: 'variants-2-0.seed.refs'})
  } catch (e) {
    if (!/already exists/i.test(body(e))) throw e
    await x.action({actionType: 'sanity.action.document.variant.delete', publishedId, variantId, bundleId} as never)
    await x.action(actions as never, {tag: 'variants-2-0.seed.refs'})
  }
}
const authorDoc = async (id: string) => {
  const {_id, _rev, _createdAt, _updatedAt, _system, ...rest} = (await x.fetch('*[_id == $id][0]', {id})) as Record<string, unknown>
  void [_id, _rev, _createdAt, _updatedAt, _system]
  return rest
}
const pick = (slugPart: string) => [...authors.keys()].find((k) => k.includes(slugPart))
for (const [part, variantId, text, draft] of [
  ['maren', 'aud-members', 'Members get the keeper\'s logbook pages with this author.', false],
  ['elif', 'aud-returning-visitors', 'Welcome back: the author answers readers\' letters.', false],
  ['ines', 'aud-members', 'Members can join the author\'s reading circle.', true],
] as const) {
  const id = pick(part)
  if (!id) continue
  const doc = await authorDoc(`author-${id}`)
  await variant(`author-${id}`, variantId, 'drafts', {...doc, bio: `${doc.bio} ${text}`}, true)
  if (draft) await variant(`author-${id}`, variantId, 'drafts', {...doc, bio: `${doc.bio} ${text} (edited)`})
}
console.log('author variants done')
