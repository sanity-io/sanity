// The composed bar's address mapping (compare/composed/composedModel.ts): the studio's {perspective, variant} to the bar's values and back. Pure. node journeys/verify-composed-model.mts
import {
  addressOfSide,
  comparedKeys,
  DEFAULT_BUNDLES,
  fromBar,
  representable,
  sideOfAddress,
  toBar,
  valuesForVariant,
  variantForValues,
} from '../compare/composed/composedModel.ts'

let failed = 0
const ok = (name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`)
  if (!pass) failed++
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const variants = [
  {_id: '_.variants.aud-members', conditions: {audience: 'members'}},
  {_id: '_.variants.aud-visitors', conditions: {audience: 'visitors'}},
  {_id: '_.variants.mkt-dach', conditions: {market: 'dach'}},
  {_id: '_.variants.aud-members-dach', conditions: {audience: 'members', market: 'dach'}},
]
const bundles = [...DEFAULT_BUNDLES, {id: 'rHalloween', label: 'Halloween'}]

// Variant ids and condition values
ok(
  'a short variant id gives its condition values',
  same(valuesForVariant('aud-members', variants), {audience: 'members'}),
)
ok(
  'a full variant id gives the same values',
  same(valuesForVariant('_.variants.aud-members', variants), {audience: 'members'}),
)
ok('none gives no values', same(valuesForVariant('none', variants), {}))
ok('an unknown variant gives no values', same(valuesForVariant('nope', variants), {}))
ok(
  'values give the short id of the exact definition',
  variantForValues({audience: 'members'}, variants) === 'aud-members',
)
ok(
  'a compound definition is found by all its values',
  variantForValues({market: 'dach', audience: 'members'}, variants) === 'aud-members-dach',
)
ok('no values is none', variantForValues({}, variants) === 'none')
ok(
  'values with no single definition are a composite (null)',
  variantForValues({audience: 'members', market: 'uk'}, variants) === null,
)

// One side, no comparison
const drafts = {perspective: 'drafts', variant: 'aud-members'}
const anchor = sideOfAddress(drafts, variants)
ok('an address becomes a side', same(anchor, {bundle: 'drafts', values: {audience: 'members'}}))
ok(
  'a side becomes an address',
  same(addressOfSide(anchor, variants), {perspective: 'drafts', variant: 'aud-members'}),
)
const single = toBar(anchor, undefined, bundles)
ok(
  'one side is one value per key, the bundle by label',
  same(single, {bundle: ['Draft'], audience: ['members']}),
)
ok('one side is not compared', comparedKeys(single).length === 0)
const back = fromBar(single, bundles)
ok(
  'one side round-trips with no counterpart',
  same(back, {anchor}) && back.counterpart === undefined,
)

// Bundle: Draft, Published and a release are ONE axis (D10)
const published = {bundle: 'published', values: {audience: 'members'}}
const layer = toBar(anchor, published, bundles)
ok(
  'Draft against Published is one compared key: the bundle',
  same(layer, {bundle: ['Draft', 'Published'], audience: ['members']}) &&
    same(comparedKeys(layer), ['bundle']),
)
const layerBack = fromBar(layer, bundles)
ok(
  'it reads back as two sides that differ only in the bundle',
  same(layerBack, {anchor, counterpart: published}),
)
const release = {bundle: 'rHalloween', values: {audience: 'members'}}
ok(
  'a release is a bundle value by its label',
  same(toBar(release, published, bundles).bundle, ['Halloween', 'Published']),
)
ok(
  'a release label reads back as the release id',
  fromBar({bundle: ['Draft', 'Halloween']}, bundles).counterpart?.bundle === 'rHalloween',
)
ok(
  'two releases compare on the one bundle key',
  same(comparedKeys(toBar(release, {...release, bundle: 'drafts'}, bundles)), ['bundle']),
)

// One dimension compared
const visitors = {bundle: 'drafts', values: {audience: 'visitors'}}
const variantCompare = toBar(anchor, visitors, bundles)
ok(
  'two audiences are one compared key',
  same(variantCompare, {bundle: ['Draft'], audience: ['members', 'visitors']}) &&
    same(comparedKeys(variantCompare), ['audience']),
)
const variantBack = fromBar(variantCompare, bundles)
ok(
  'it reads back as two sides, the same bundle',
  same(variantBack.anchor, anchor) && same(variantBack.counterpart, visitors),
)
ok(
  'the Against side is the studio address aud-visitors in Drafts',
  same(addressOfSide(variantBack.counterpart!, variants), {
    perspective: 'drafts',
    variant: 'aud-visitors',
  }),
)

// Two dimensions: the bar can hold it, and maxCompared refuses it at the component. The model reports it.
const both = toBar(anchor, {bundle: 'published', values: {audience: 'visitors'}}, bundles)
ok(
  'bundle and audience both differing is two compared keys',
  same(comparedKeys(both), ['bundle', 'audience']),
)
ok(
  'a bar with two compared keys reads back as one pair of sides',
  fromBar(both, bundles).counterpart?.bundle === 'published' &&
    fromBar(both, bundles).counterpart?.values.audience === 'visitors',
)

// Shared keys stay shared; keys on one side only are not representable
const shared = toBar(
  {bundle: 'drafts', values: {audience: 'members', market: 'dach'}},
  {bundle: 'drafts', values: {audience: 'visitors', market: 'dach'}},
  bundles,
)
ok(
  'a key both sides share holds one value',
  same(shared.market, ['dach']) && same(shared.audience, ['members', 'visitors']),
)
ok('sides with the same keys are representable', representable(anchor, visitors))
ok(
  'a key on one side only is not representable',
  !representable(anchor, {bundle: 'drafts', values: {}}),
)
ok(
  'that key is dropped by toBar',
  !('audience' in toBar(anchor, {bundle: 'drafts', values: {}}, bundles)),
)

// Edges
ok(
  'a bar with no bundle reads as the first bundle',
  fromBar({audience: ['members']}, bundles).anchor.bundle === 'drafts',
)
ok(
  'an unknown bundle label is its own id',
  fromBar({bundle: ['Mystery']}, bundles).anchor.bundle === 'Mystery',
)
ok(
  'a bundle id with no option is its own label',
  same(toBar({bundle: 'rX', values: {}}).bundle, ['rX']),
)

process.exit(failed ? 1 : 0)
