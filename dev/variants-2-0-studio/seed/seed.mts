// Seeds the Variants 2.0 test dataset (ppsg7ml5 / variants-2-0): the Nordic Books fixture plus the
// permutations Figma listed as missing (see ../PERMUTATIONS.md). Idempotent: re-run at will.
//
// Writes use the same APIs Studio uses, as in repos/northfold-storefront/scripts/seed.ts:
//  - base documents and drafts: mutate createOrReplace
//  - variant definitions: sanity.action.variant.definition.create
//  - variant versions: sanity.action.document.variant.create (+ .publish), bundleId `drafts` or a release id
//  - releases: sanity.action.release.create / .schedule / .archive / .publish
// The token is read at runtime from ~/.config/sanity/config.json and is never printed.

import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient, type SanityClient} from '@sanity/client'

const projectId = 'ppsg7ml5'
const dataset = 'variants-2-0'
if (dataset !== 'variants-2-0') throw new Error('refusing to write outside the variants-2-0 dataset')

const warn = console.warn
console.warn = (...args: unknown[]) => {
  if (String(args[0]).includes('experimental API version')) return
  warn(...args)
}

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken
if (typeof token !== 'string' || !token) throw new Error('No Sanity CLI authToken; run `sanity login`')

const x: SanityClient = createClient({projectId, dataset, apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const dated: SanityClient = createClient({projectId, dataset, apiVersion: '2025-02-19', useCdn: false, token, perspective: 'raw'})

const log = (...a: unknown[]) => console.log(...a)
const errBody = (e: any) => {
  const b = e?.response?.body
  return b ? JSON.stringify(b.error ?? b) : String(e?.message ?? e)
}

type Fixture = {
  audiences: string[]
  documents: Array<{
    id: string
    title: string
    subtitle: string | null
    versions: Array<{audience: string | null; state: 'published' | 'draft' | 'scheduled' | 'asap'; release: string | null}>
  }>
}
const fixture: Fixture = JSON.parse(readFileSync(new URL('./nordic-books.json', import.meta.url), 'utf8'))

// ------------------------------------------------------------------ definitions
const slug = (audience: string) => audience.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')
const audienceVariantId = (audience: string) => `aud-${slug(audience)}`

type Definition = {variantId: string; title: string; conditions: Record<string, string>; priority: number}
const definitions: Definition[] = [
  ...fixture.audiences.map((a) => ({
    variantId: audienceVariantId(a),
    title: a,
    conditions: {audience: slug(a)},
    priority: 20,
  })),
  // A second dimension (locale), plus two composites, so addresses with 2 chips exist.
  {variantId: 'loc-en-gb', title: 'en-GB', conditions: {locale: 'en-GB'}, priority: 100},
  {variantId: 'loc-de-de', title: 'de-DE', conditions: {locale: 'de-DE'}, priority: 100},
  {variantId: 'loc-fr-fr', title: 'fr-FR', conditions: {locale: 'fr-FR'}, priority: 100},
  {variantId: 'aud-loyal-customers__loc-de-de', title: 'Loyal customers · de-DE', conditions: {audience: 'loyal-customers', locale: 'de-DE'}, priority: 100},
  {variantId: 'aud-students__loc-fr-fr', title: 'Students · fr-FR', conditions: {audience: 'students', locale: 'fr-FR'}, priority: 100},
]

// ------------------------------------------------------------------ releases
const berlin = (date: string) => `${date}+01:00` // after the 25 Oct clock change
type ReleaseSpec = {id: string; metadata: Record<string, unknown>; schedule?: string}
const releases: Record<string, ReleaseSpec> = {
  Halloween: {id: 'rHalloween', metadata: {title: 'Halloween', releaseType: 'scheduled', intendedPublishAt: new Date(berlin('2026-10-31T09:00:00')).toISOString()}, schedule: berlin('2026-10-31T09:00:00')},
  'Black Friday': {id: 'rBlackFriday', metadata: {title: 'Black Friday', releaseType: 'scheduled', intendedPublishAt: new Date(berlin('2026-11-20T09:00:00')).toISOString()}, schedule: berlin('2026-11-20T09:00:00')},
  'ASAP (Copy)': {id: 'rAsapCopy', metadata: {title: 'ASAP (Copy)', releaseType: 'asap'}},
}

// ------------------------------------------------------------------ helpers
const results: Array<{label: string; ok: boolean; note?: string}> = []
async function attempt(label: string, fn: () => Promise<string | void>) {
  try {
    const note = await fn()
    results.push({label, ok: true, note: note || undefined})
  } catch (e: any) {
    results.push({label, ok: false, note: errBody(e)})
  }
}

const content = (title: string, subtitle: string | null, blurb: string) => ({
  _type: 'book',
  title,
  ...(subtitle ? {subtitle} : {}),
  blurb,
})

async function releaseExists(id: string) {
  return Boolean(await x.fetch(`*[_id == $id][0]._id`, {id: `_.releases.${id}`}))
}

async function ensureRelease(id: string, metadata: Record<string, unknown>) {
  if (await releaseExists(id)) return false
  await x.action({actionType: 'sanity.action.release.create', releaseId: id, metadata} as any)
  return true
}

async function schedule(id: string, publishAt: string) {
  await x.action({actionType: 'sanity.action.release.schedule', releaseId: id, publishAt: new Date(publishAt).toISOString()} as any)
}

async function variantVersion(publishedId: string, variantId: string, bundleId: string, document: Record<string, unknown>, publish = false) {
  const create = {actionType: 'sanity.action.document.variant.create', publishedId, variantId, bundleId, document}
  const actions: any[] = [create]
  if (publish) actions.push({actionType: 'sanity.action.document.variant.publish', publishedId, variantId, bundleId})
  try {
    await x.action(actions as any, {tag: 'variants-2-0.seed.variant'})
  } catch (e: any) {
    if (!/already exists/i.test(errBody(e))) throw e
    await x.action({actionType: 'sanity.action.document.variant.delete', publishedId, variantId, bundleId} as any)
    await x.action(actions as any, {tag: 'variants-2-0.seed.variant'})
  }
}

async function releaseVersion(releaseId: string, publishedId: string, document: Record<string, unknown>) {
  await x.action(
    {actionType: 'sanity.action.document.version.create', publishedId, document: {...document, _id: `versions.${releaseId}.${publishedId}`}} as any,
    {tag: 'variants-2-0.seed.version'},
  )
}

// ------------------------------------------------------------------ steps
async function seedBase() {
  const tx = dated.transaction()
  let published = 0
  let drafts = 0
  for (const d of fixture.documents) {
    const base = d.versions.filter((v) => v.audience === null)
    const hasPublished = base.some((v) => v.state === 'published')
    const hasDraft = base.some((v) => v.state === 'draft')
    if (hasPublished) {
      tx.createOrReplace({_id: d.id, ...content(d.title, d.subtitle, 'Base · published')})
      published++
    }
    if (hasDraft) {
      tx.createOrReplace({_id: `drafts.${d.id}`, ...content(d.title, d.subtitle, hasPublished ? 'Base · draft edit' : 'Base · draft only')})
      drafts++
    }
  }
  // Documents for the extra permutations (see seedExtras).
  tx.createOrReplace({_id: 'book-scheduled-draft', ...content('The Ferry Timetable', 'By Linnea Strand · 2025', 'Base · published')})
  tx.createOrReplace({_id: 'drafts.book-scheduled-draft', ...content('The Ferry Timetable (revised)', 'By Linnea Strand · 2025', 'Draft that is scheduled to publish')})
  // Once the "published" release has run, its content is the published document: do not reset it.
  const released = await releaseExists('rPublished')
  tx.createOrReplace({_id: 'book-released', ...(released ? content('Harbour Lights (2nd edition)', 'By Kari Moe · 2022', 'After the release') : content('Harbour Lights', 'By Kari Moe · 2022', 'Before the release'))})
  tx.createOrReplace({_id: 'book-translations', ...content('Midsummer', 'By Astrid Lund · 2023', 'Base · published (en-US)')})
  tx.createOrReplace({_id: 'live-atlas', _type: 'bookLive', title: 'Atlas of Small Islands', subtitle: 'Live edit: no drafts', blurb: 'Published only'})
  tx.createOrReplace({_id: 'live-almanac', _type: 'bookLive', title: 'Tide Almanac', subtitle: 'Live edit: no drafts', blurb: 'Published only'})
  await tx.commit({visibility: 'sync'})
  log(`base: ${published} published, ${drafts} drafts, plus extras (scheduled-draft, released, translations, 2 live-edit)`)
}

async function seedDefinitions() {
  const existing: Array<{_id: string}> = await x.fetch(`*[_type == "system.variant"]{_id}`)
  const have = new Set(existing.map((d) => d._id.replace(/^_\.variants\./, '')))
  let created = 0
  for (const def of definitions) {
    if (have.has(def.variantId)) continue
    await x.action(
      {actionType: 'sanity.action.variant.definition.create', variantId: def.variantId, conditions: def.conditions, priority: def.priority, metadata: {title: def.title}} as any,
      {tag: 'variants-2-0.seed.definition'},
    )
    created++
  }
  log(`definitions: ${definitions.length} (created ${created})`)
}

async function seedFixtureVariants() {
  // A scheduled release cannot be mutated, so on a rerun its versions already exist: skip them.
  const fresh = new Set<string>()
  for (const spec of Object.values(releases)) if (await ensureRelease(spec.id, spec.metadata)) fresh.add(spec.id)
  for (const d of fixture.documents) {
    for (const v of d.versions) {
      if (v.audience === null) continue
      const variantId = audienceVariantId(v.audience)
      const blurb = `${v.audience} · ${v.state}${v.release ? ` in ${v.release}` : ''}`
      const doc = content(d.title, d.subtitle, blurb)
      await attempt(`${d.id} / ${v.audience} / ${v.state}`, async () => {
        if (v.state === 'published') return variantVersion(d.id, variantId, 'drafts', doc, true)
        if (v.state === 'draft') return variantVersion(d.id, variantId, 'drafts', doc)
        const release = releases[v.release!]
        if (!release) throw new Error(`unknown release ${v.release}`)
        if (!fresh.has(release.id) && release.schedule) return 'release already scheduled'
        return variantVersion(d.id, variantId, release.id, doc)
      })
    }
  }
  for (const spec of Object.values(releases)) {
    if (spec.schedule && fresh.has(spec.id)) await attempt(`schedule ${spec.id}`, () => schedule(spec.id, spec.schedule!).then(() => spec.schedule!))
  }
}

async function seedExtras() {
  // 1. Scheduled draft (a cardinality `one` release), not in a normal release.
  await attempt('scheduled draft (not in a release)', async () => {
    const id = 'rSchedDraft'
    if (await releaseExists(id)) return 'exists'
    const at = berlin('2026-11-03T09:00:00')
    await ensureRelease(id, {title: 'Scheduled draft', description: '', releaseType: 'scheduled', cardinality: 'one', intendedPublishAt: new Date(at).toISOString()})
    await releaseVersion(id, 'book-scheduled-draft', content('The Ferry Timetable (revised)', 'By Linnea Strand · 2025', 'Draft that is scheduled to publish'))
    await schedule(id, at)
  })
  // 2. Undecided release, holding a base version and a variant version.
  await attempt('undecided release', async () => {
    if (await releaseExists('rUndecided')) return 'exists'
    await ensureRelease('rUndecided', {title: 'Autumn catalogue (undecided)', releaseType: 'undecided'})
    await releaseVersion('rUndecided', 'book-field-guide', content('A Field Guide to Small Hours', 'By Elif Demir · 2023', 'Base · in an undecided release'))
    await variantVersion('book-salt', audienceVariantId('Students'), 'rUndecided', content('Salt & Ember', 'By Tove Nilsen · 2019', 'Students · in an undecided release'))
  })
  // 3. Published release (moves the published document).
  await attempt('published release', async () => {
    if (await releaseExists('rPublished')) return 'exists'
    await ensureRelease('rPublished', {title: 'Harbour relaunch (published)', releaseType: 'asap'})
    await releaseVersion('rPublished', 'book-released', content('Harbour Lights (2nd edition)', 'By Kari Moe · 2022', 'After the release'))
    await x.action({actionType: 'sanity.action.release.publish', releaseId: 'rPublished'} as any)
  })
  // 4. Archived release.
  await attempt('archived release', async () => {
    if (await releaseExists('rArchived')) return 'exists'
    await ensureRelease('rArchived', {title: 'Spring list (archived)', releaseType: 'undecided'})
    await releaseVersion('rArchived', 'book-tidewater', content('Tidewater', null, 'Base · in an archived release'))
    await x.action({actionType: 'sanity.action.release.archive', releaseId: 'rArchived'} as any)
  })
  // 4b. A document that exists only inside a release (no published base, no draft).
  await attempt('release-only document', async () => {
    const exists = await x.fetch(`defined(*[_id == "versions.rAsapCopy.book-release-only"][0]._id)`)
    if (exists) return 'exists'
    await releaseVersion('rAsapCopy', 'book-release-only', content('The Unpublished Atlas', 'edge: release only', 'Exists only in the ASAP (Copy) release'))
  })
  // 5. A variant whose base was never published (book-rail has only a draft).
  await attempt('variant with no published base', () =>
    variantVersion('book-rail', audienceVariantId('Returning visitors'), 'drafts', content('Notes from the Northern Rail', 'By Jonas Aalto · 2018', 'Returning visitors · base never published')),
  )
  // 6. Locale dimension, alone and combined with audience.
  const t = content('Midsummer', 'By Astrid Lund · 2023', '')
  await attempt('locale variants', async () => {
    await variantVersion('book-translations', 'loc-en-gb', 'drafts', {...t, blurb: 'en-GB · published'}, true)
    await variantVersion('book-translations', 'loc-de-de', 'drafts', {...t, title: 'Mittsommer', blurb: 'de-DE · published'}, true)
    await variantVersion('book-translations', 'loc-de-de', 'drafts', {...t, title: 'Mittsommer (neu)', blurb: 'de-DE · draft edit'})
    await variantVersion('book-translations', 'loc-fr-fr', 'drafts', {...t, title: "La Saint-Jean", blurb: 'fr-FR · draft only'})
    await variantVersion('book-translations', 'aud-loyal-customers__loc-de-de', 'drafts', {...t, title: 'Mittsommer für Stammkunden', blurb: 'Loyal customers · de-DE · published'}, true)
    await variantVersion('book-translations', 'aud-students__loc-fr-fr', 'rAsapCopy', {...t, title: 'La Saint-Jean, édition étudiante', blurb: 'Students · fr-FR · in ASAP (Copy)'})
  })
}

async function report() {
  const counts = await x.fetch(`{
    "definitions": count(*[_type == "system.variant"]),
    "books": count(*[_type == "book" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]),
    "drafts": count(*[_type == "book" && _id in path("drafts.**")]),
    "releaseVersions": count(*[_id in path("versions.**")]),
    "releases": count(*[_type == "system.release"]),
    "live": count(*[_type == "bookLive"])
  }`)
  log('dataset now:', JSON.stringify(counts))
  const failed = results.filter((r) => !r.ok)
  log(`steps: ${results.length - failed.length} ok, ${failed.length} failed`)
  for (const r of failed) log(`  FAILED  ${r.label}: ${r.note}`)
}

const t0 = Date.now()
await seedBase()
await seedDefinitions()
await seedFixtureVariants()
await seedExtras()
await report()
log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
