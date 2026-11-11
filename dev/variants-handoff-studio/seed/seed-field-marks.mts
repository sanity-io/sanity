// Seeds the field-marks test document (fm-1) in variants-2-0: a base and a Members variant that differ in every field kind.
// Idempotent. node seed/seed-field-marks.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})

// A 1x1 PNG, uploaded once for the cover image.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const asset = await x.assets.upload('image', png, {filename: 'field-marks.png'})

const block = (key: string, text: string) => ({_type: 'block', _key: key, style: 'normal', markDefs: [], children: [{_type: 'span', _key: `${key}s`, text, marks: []}]})
const base = {
  _type: 'fieldMarksTest',
  title: 'Field marks test',
  subtitle: 'The same in both',
  settings: {theme: 'light', meta: {owner: 'Base owner', region: 'EU'}},
  tags: ['alpha', 'beta', 'gamma'],
  sections: [
    {_type: 'section', _key: 's1', heading: 'One', text: 'Same in both'},
    {_type: 'section', _key: 's2', heading: 'Two', text: 'Base text of two'},
    {_type: 'section', _key: 's3', heading: 'Three', text: 'Removed in the variant'},
  ],
  featured: {_type: 'reference', _ref: 'book-lighthouse'},
  cover: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
  body: [block('b1', 'First paragraph, the same in both.'), block('b2', 'Second paragraph, base wording.'), block('b3', 'Third paragraph, the same in both.')],
}
const variant = {
  ...base,
  title: 'Field marks test (Members)',
  settings: {theme: 'light', meta: {owner: 'Base owner', region: 'Nordics'}},
  tags: ['alpha', 'beta', 'delta', 'gamma'],
  sections: [
    {_type: 'section', _key: 's1', heading: 'One', text: 'Same in both'},
    {_type: 'section', _key: 's2', heading: 'Two', text: 'Members text of two'},
    {_type: 'section', _key: 's4', heading: 'Four', text: 'New in the variant'},
  ],
  featured: {_type: 'reference', _ref: 'book-glass'},
  cover: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, crop: {_type: 'sanity.imageCrop', top: 0.1, bottom: 0.1, left: 0.1, right: 0.1}},
  body: [block('b1', 'First paragraph, the same in both.'), block('b2', 'Second paragraph, Members wording.'), block('b3', 'Third paragraph, the same in both.')],
}

await x.createOrReplace({_id: 'fm-1', ...base})
const del = {actionType: 'sanity.action.document.variant.delete', publishedId: 'fm-1', variantId: 'aud-members'}
await x.action(del as never).catch(() => undefined)
await x.action(del as never).catch(() => undefined)
await x.action(
  [
    {actionType: 'sanity.action.document.variant.create', publishedId: 'fm-1', variantId: 'aud-members', bundleId: 'drafts', document: variant},
    {actionType: 'sanity.action.document.variant.publish', publishedId: 'fm-1', variantId: 'aud-members', bundleId: 'drafts'},
  ] as never,
)
console.log('seeded fm-1 with a Members variant:', JSON.stringify(await x.fetch('*[_id match "*fm-1"]{_id,"v":_system.variant._ref,"b":_system.bundleId}')))
