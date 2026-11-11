// Seeds the E9 fixtures (local perspective, compare, review, list, field marks) in variants-2-0. Idempotent: node seed/seed-e9.mts
//  e9Case  e9-visitors  base + Returning visitors AND Members, each published and with a newer draft (same-variant draft and published)
//          e9-danish    base + a Danish variant that is only published (no draft)
//          e9-no-de     base + en-GB and fr-FR, no de-DE (the fallback case)
//  e9Set   e9-set-01..13  ten documents with a Returning visitors variant (7 differ from the base, 3 are the same), three without one
//  rE9     a release that holds variant versions of e9-set-01..03 (undecided, so it stays editable)
//  fieldMarksTest  fm-2   a Returning visitors variant with array items changed, removed, moved and added, portable text blocks changed,
//                         a change inside a collapsed fieldset and a nested object, and a field that is not in the schema (unknown path)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const dated = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: '2025-02-19', useCdn: false, token, perspective: 'raw'})
const RV = 'aud-returning-visitors'
const MEM = 'aud-members'
const body = (e: any) => JSON.stringify(e?.response?.body?.error ?? e?.message ?? e)

// ------------------------------------------------------------------ helpers
async function ensureDefinition(variantId: string, title: string, conditions: Record<string, string>, priority: number) {
  const have = await x.fetch(`defined(*[_id == $id][0]._id)`, {id: `_.variants.${variantId}`})
  if (have) return
  await x.action({actionType: 'sanity.action.variant.definition.create', variantId, conditions, priority, metadata: {title}} as never)
  console.log('definition', variantId)
}
async function ensureRelease(id: string, metadata: Record<string, unknown>) {
  const have = await x.fetch(`defined(*[_id == $id][0]._id)`, {id: `_.releases.${id}`})
  if (!have) await x.action({actionType: 'sanity.action.release.create', releaseId: id, metadata} as never)
}
async function variant(publishedId: string, variantId: string, bundleId: string, document: Record<string, unknown>, publish = false) {
  const create = {actionType: 'sanity.action.document.variant.create', publishedId, variantId, bundleId, document}
  const actions: unknown[] = [create]
  if (publish) actions.push({actionType: 'sanity.action.document.variant.publish', publishedId, variantId, bundleId})
  try {
    await x.action(actions as never, {tag: 'variants-2-0.seed.e9'})
  } catch (e) {
    if (!/already exists/i.test(body(e))) throw e
    await x.action({actionType: 'sanity.action.document.variant.delete', publishedId, variantId, bundleId} as never)
    await x.action(actions as never, {tag: 'variants-2-0.seed.e9'})
  }
}
const drop = (publishedId: string, variantId: string, bundleId = 'drafts') =>
  x.action({actionType: 'sanity.action.document.variant.delete', publishedId, variantId, bundleId} as never).catch(() => undefined)

// ------------------------------------------------------------------ definitions and release
await ensureDefinition('loc-da-dk', 'Danish', {locale: 'da-DK'}, 100)
await ensureRelease('rE9', {title: 'E9 review release', releaseType: 'undecided'})

// ------------------------------------------------------------------ e9Case
const base = (title: string, subtitle: string, blurb: string, extra: Record<string, unknown> = {}) => ({
  _type: 'e9Case', title, subtitle, blurb, promo: 'Free shipping over 300 kr.', cta: 'Add to cart', highlights: ['Twelve chapters', 'Tide tables'], ...extra,
})
const visitors = base('The Tide Reader', 'By Maren Halvorsen', 'A year on a skerry, told through weather and letters.')
const danish = base('Tidevandsbogen', 'Af Maren Halvorsen', 'Et år på en skær, fortalt gennem vejret og brevene.')
const noDe = base('The Harbour Atlas', 'By Kari Moe', 'Every harbour on the coast, with the soundings.')
await dated.transaction()
  .createOrReplace({_id: 'e9-visitors', ...visitors})
  .createOrReplace({_id: 'e9-danish', ...visitors, title: 'The Tide Reader (Danish)'})
  .createOrReplace({_id: 'e9-no-de', ...noDe})
  .commit({visibility: 'sync'})
// The Danish title above is the base; replace it with the plain base so only the variant differs from it.
await dated.createOrReplace({_id: 'e9-danish', ...base('The Tide Reader, Danish edition', 'By Maren Halvorsen', 'A year on a skerry, told through weather and letters.')})

// Same-variant draft AND published: the published variant, then a newer draft of the same variant.
for (const [vid, label] of [[RV, 'Returning visitors'], [MEM, 'Members']] as const) {
  await variant('e9-visitors', vid, 'drafts', {...visitors, title: `The Tide Reader for ${label}`, promo: `${label}: free shipping from the first book.`, badge: label}, true)
  await variant('e9-visitors', vid, 'drafts', {...visitors, title: `The Tide Reader for ${label} (new)`, promo: `${label}: free shipping from the first book.`, badge: label, cta: 'Add at the usual price'})
}
// A variant that is only published: no draft next to it.
await variant('e9-danish', 'loc-da-dk', 'drafts', {...danish}, true)
// No de-DE: only en-GB and fr-FR exist, so de-DE falls back to the base.
await variant('e9-no-de', 'loc-en-gb', 'drafts', {...noDe, subtitle: 'By Kari Moe · UK edition'}, true)
await variant('e9-no-de', 'loc-fr-fr', 'drafts', {...noDe, title: "L'Atlas des ports", subtitle: 'Par Kari Moe', blurb: 'Tous les ports de la côte, avec les sondages.'}, true)
console.log('e9Case done')

// ------------------------------------------------------------------ e9Set
const TITLES = ['Salt and Ember', 'The Ferry Timetable', 'Letters to a Gardener', 'Glass Houses', 'Harvest Moon', 'Northern Rail', 'Harbour Lights', 'Midsummer', 'Winterhold', 'Tidewater', 'The Quiet Cartographer', 'A Field Guide', 'Small Hours']
const setBase = (i: number) => ({
  _type: 'e9Set', title: TITLES[i], subtitle: `By Author ${i + 1}`, blurb: `${TITLES[i]}: the base blurb, as published.`, promo: 'Free shipping over 300 kr.', cta: 'Add to cart',
})
const tx = dated.transaction()
for (let i = 0; i < 13; i++) tx.createOrReplace({_id: `e9-set-${String(i + 1).padStart(2, '0')}`, ...setBase(i)})
await tx.commit({visibility: 'sync'})
for (let i = 0; i < 10; i++) {
  const id = `e9-set-${String(i + 1).padStart(2, '0')}`
  const b = setBase(i)
  // 1-7 differ from the base (a different blurb, and on some a different promo); 8-10 are the same as it.
  const doc = i < 7
    ? {...b, blurb: `${TITLES[i]}: the returning-visitors blurb, written for readers who came back.`, ...(i % 2 === 0 ? {promo: 'Welcome back: free shipping on any book.'} : {})}
    : {...b}
  await variant(id, RV, 'drafts', doc, true)
}
// The release holds variant versions of the first three.
for (let i = 0; i < 3; i++) {
  const id = `e9-set-${String(i + 1).padStart(2, '0')}`
  await variant(id, RV, 'rE9', {...setBase(i), blurb: `${TITLES[i]}: the autumn returning-visitors blurb.`, cta: 'Add to the autumn list'})
}
console.log('e9Set done')

// ------------------------------------------------------------------ fm-2 (field marks)
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const asset = await x.assets.upload('image', png, {filename: 'field-marks.png'})
const block = (key: string, text: string) => ({_type: 'block', _key: key, style: 'normal', markDefs: [], children: [{_type: 'span', _key: `${key}s`, text, marks: []}]})
const fm = {
  _type: 'fieldMarksTest', title: 'Field marks test 2', subtitle: 'The same in both',
  settings: {theme: 'light', meta: {owner: 'Base owner', region: 'EU'}},
  tags: ['alpha', 'beta', 'gamma', 'delta'],
  sections: [
    {_type: 'section', _key: 's1', heading: 'One', text: 'Same in both'},
    {_type: 'section', _key: 's2', heading: 'Two', text: 'Base text of two'},
    {_type: 'section', _key: 's3', heading: 'Three', text: 'Removed in the variant'},
  ],
  featured: {_type: 'reference', _ref: 'book-lighthouse'},
  cover: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
  body: [block('b1', 'First paragraph, base wording.'), block('b2', 'Second paragraph, the same in both.'), block('b3', 'Third paragraph, removed in the variant.')],
  seoTitle: 'Field marks, base', seoDescription: 'The same in both',
}
const fmVariant = {
  ...fm,
  title: 'Field marks test 2 (Returning visitors)',
  settings: {theme: 'light', meta: {owner: 'Base owner', region: 'Nordics'}},
  // delta moved to the front, gamma removed, epsilon added
  tags: ['delta', 'alpha', 'beta', 'epsilon'],
  // s2 moved to the front, s1 changed inside, s3 removed, s4 added
  sections: [
    {_type: 'section', _key: 's2', heading: 'Two', text: 'Base text of two'},
    {_type: 'section', _key: 's1', heading: 'One', text: 'Changed inside the variant'},
    {_type: 'section', _key: 's4', heading: 'Four', text: 'New in the variant'},
  ],
  body: [block('b1', 'First paragraph, returning-visitors wording.'), block('b2', 'Second paragraph, the same in both.'), block('b4', 'A new paragraph, only in the variant.')],
  seoTitle: 'Field marks, returning visitors',
  // Not in the schema: an unknown path.
  legacyNote: 'A value the schema does not know about',
}
await dated.createOrReplace({_id: 'fm-2', ...fm})
await variant('fm-2', RV, 'drafts', fmVariant, true)
// A newer draft of the same variant, so "since Published" has changes too.
await variant('fm-2', RV, 'drafts', {...fmVariant, title: 'Field marks test 2 (Returning visitors, edited)', tags: ['delta', 'alpha', 'beta', 'epsilon', 'zeta']})
console.log('fm-2 done')
console.log(JSON.stringify(await x.fetch('count(*[_id match "*e9-*" || _id match "*fm-2"])')), 'e9 and fm-2 documents (all versions)')
