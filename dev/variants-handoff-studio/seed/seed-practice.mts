// Seeds the practice sets for the delete tasks in the review guide (6.1-6.3) in variants-2-0: node seed/seed-practice.mts
// Ten numbered sets, one per reviewer, so nobody deletes the fixture someone else needs. Re-run it to top the sets back up:
// it recreates what was deleted and reschedules what was unscheduled. Each set NN holds:
//   practice-NN               "Practice NN": published Default, a published Members variant with a draft of it, and a
//                             Loyal customers variant in the scheduled release "ZZ Practice NN · scheduled" (6.1, 6.3)
//   practice-NN-linked        "Practice NN · linked": published Default only, no variants (6.2: delete it, see the links warning)
//   practice-NN-links-here    "Practice NN · links here": links to "Practice NN · linked" (a weak reference, so the delete goes through)
//   practice-NN-scheduled     "Practice NN · scheduled draft": a draft scheduled on its own, not in a release (6.3: Pause)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const dated = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: '2025-02-19', useCdn: false, token, perspective: 'raw'})
const errBody = (e: any) => JSON.stringify(e?.response?.body?.error ?? e?.message ?? e)

const SETS = Number(process.env.SETS ?? 10)
const PUBLISH_AT = new Date('2027-06-01T09:00:00+02:00').toISOString() // far enough out that nothing ever goes live
const MEMBERS = 'aud-members'
const LOYAL = 'aud-loyal-customers'
const pad = (n: number) => String(n).padStart(2, '0')

async function releaseState(id: string): Promise<string | null> {
  return (await x.fetch(`*[_id == $id][0].state`, {id: `_.releases.${id}`})) ?? null
}
async function exists(id: string) {
  return Boolean(await x.fetch(`defined(*[_id == $id][0]._id)`, {id}))
}
async function variantVersion(publishedId: string, variantId: string, bundleId: string, document: Record<string, unknown>, publish = false) {
  const actions: any[] = [{actionType: 'sanity.action.document.variant.create', publishedId, variantId, bundleId, document}]
  if (publish) actions.push({actionType: 'sanity.action.document.variant.publish', publishedId, variantId, bundleId})
  try {
    await x.action(actions as any, {tag: 'variants-2-0.seed.practice'})
    return 'created'
  } catch (e: any) {
    if (/already exists/i.test(errBody(e))) return 'exists'
    throw e
  }
}
/** A release (or a scheduled draft, cardinality one) holding one version, scheduled for PUBLISH_AT. Recreates what is missing. */
async function scheduledRelease(releaseId: string, metadata: Record<string, unknown>, addVersion: () => Promise<unknown>) {
  let state = await releaseState(releaseId)
  if (state === 'scheduled') return 'scheduled already'
  if (state === 'archived' || state === 'published') return `left alone (${state})`
  if (state === null) {
    await x.action({actionType: 'sanity.action.release.create', releaseId, metadata: {...metadata, releaseType: 'scheduled', intendedPublishAt: PUBLISH_AT}} as any)
    state = 'active'
  }
  await addVersion()
  await x.action({actionType: 'sanity.action.release.schedule', releaseId, publishAt: PUBLISH_AT} as any)
  return 'scheduled'
}

for (let i = 1; i <= SETS; i++) {
  const n = pad(i)
  const id = `practice-${n}`
  const report: string[] = []
  // Published documents: createOrReplace only where missing, so a reviewer's edits are not reset on a re-run.
  const tx = dated.transaction()
  const docs = [
    {_id: id, title: `Practice ${n}`, note: 'Variants: Members (published, plus a draft) and Loyal customers (in a scheduled release).'},
    {_id: `${id}-linked`, title: `Practice ${n} · linked`, note: `No variants. "Practice ${n} · links here" links to it.`},
    {_id: `${id}-links-here`, title: `Practice ${n} · links here`, note: `Links to "Practice ${n} · linked".`, related: {_type: 'reference', _ref: `${id}-linked`, _weak: true}},
    {_id: `${id}-scheduled`, title: `Practice ${n} · scheduled draft`, note: 'Its draft is scheduled on its own, not in a release.'},
  ]
  for (const d of docs) if (!(await exists(d._id))) tx.create({_type: 'practiceDoc', ...d})
  await tx.commit({visibility: 'sync'})

  const base = {_type: 'practiceDoc', title: `Practice ${n}`}
  report.push(`members published: ${await variantVersion(id, MEMBERS, 'drafts', {...base, note: 'Members version.'}, true)}`)
  report.push(`members draft: ${await variantVersion(id, MEMBERS, 'drafts', {...base, note: 'Members version (draft edit).'})}`)
  report.push(`loyal in release: ${await scheduledRelease(`rZZPractice${n}`, {title: `ZZ Practice ${n} · scheduled`, description: 'Practice release for the review guide (6.3).'}, () =>
    variantVersion(id, LOYAL, `rZZPractice${n}`, {...base, note: 'Loyal customers version, in a scheduled release.'}))}`)
  report.push(`scheduled draft: ${await scheduledRelease(`rZZPracticeSD${n}`, {title: `Practice ${n} · scheduled draft`, description: '', cardinality: 'one'}, async () => {
    if (await exists(`versions.rZZPracticeSD${n}.${id}-scheduled`)) return
    await x.action({actionType: 'sanity.action.document.version.create', publishedId: `${id}-scheduled`, document: {_id: `versions.rZZPracticeSD${n}.${id}-scheduled`, _type: 'practiceDoc', title: `Practice ${n} · scheduled draft`, note: 'Scheduled edit.'}} as any)
  })}`)
  console.log(`Practice ${n}: ${report.join(' · ')}`)
}

const check = await x.fetch(`{
  "docs": count(*[_type == "practiceDoc" && !(_id in path("versions.**")) && !(_id in path("drafts.**"))]),
  "variantVersions": count(*[_type == "practiceDoc" && _id in path("versions.**")]),
  "scheduledReleases": count(*[_type == "system.release" && string::startsWith(_id, "_.releases.rZZPractice") && state == "scheduled"])
}`)
console.log(JSON.stringify(check))
