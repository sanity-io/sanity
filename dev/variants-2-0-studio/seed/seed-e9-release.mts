// Seeds the M3 fixture on top of seed-e9: a release of BASE versions of e9Set documents (reviewSet B). Idempotent: node seed/seed-e9-release.mts
//  rE9m3  e9-set-04 and 05 changed against published, e9-set-06 identical, e9-set-14 new (no published version)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})
const body = (e: any) => JSON.stringify(e?.response?.body?.error ?? e?.message ?? e)
const TITLES = ['Salt and Ember', 'The Ferry Timetable', 'Letters to a Gardener', 'Glass Houses', 'Harvest Moon', 'Northern Rail']
const setBase = (i: number) => ({
  _type: 'e9Set', title: TITLES[i], subtitle: `By Author ${i + 1}`, blurb: `${TITLES[i]}: the base blurb, as published.`, promo: 'Free shipping over 300 kr.', cta: 'Add to cart',
})
const have = await x.fetch(`defined(*[_id == $id][0]._id)`, {id: '_.releases.rE9m3'})
if (!have) await x.action({actionType: 'sanity.action.release.create', releaseId: 'rE9m3', metadata: {title: 'E9 base release', releaseType: 'undecided'}} as never)
async function versionOf(publishedId: string, document: Record<string, unknown>) {
  const create = {actionType: 'sanity.action.document.version.create', publishedId, document: {_id: `versions.rE9m3.${publishedId}`, ...document}}
  try {
    await x.action(create as never, {tag: 'variants-2-0.seed.e9'})
  } catch (e) {
    if (!/already exists/i.test(body(e))) throw e
    await x.action({actionType: 'sanity.action.document.version.discard', versionId: `versions.rE9m3.${publishedId}`, purge: true} as never)
    await x.action(create as never, {tag: 'variants-2-0.seed.e9'})
  }
}
for (const i of [3, 4]) await versionOf(`e9-set-${String(i + 1).padStart(2, '0')}`, {...setBase(i), blurb: `${TITLES[i]}: the release blurb, new this autumn.`})
await versionOf('e9-set-06', {...setBase(5)})
await versionOf('e9-set-14', {_type: 'e9Set', title: 'A Book Not Yet Published', subtitle: 'By Author 14', blurb: 'Only in the release.', promo: 'Free shipping over 300 kr.', cta: 'Add to cart'})
console.log('rE9m3 done')
