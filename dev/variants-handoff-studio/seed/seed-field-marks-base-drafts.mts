// Gives the field-marks test documents a base DRAFT, so the field diamonds show in Drafts (26 Oct). Core compares a variant draft only with the
// base draft; without one there is nothing to compare and no diamond appears. Each base draft starts as a copy of the published base.
// Idempotent (createIfNotExists). node --experimental-strip-types seed/seed-field-marks-base-drafts.mts
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})

for (const id of ['fm-1', 'fm-2']) {
  const published = await x.getDocument(id)
  if (!published) {
    console.log(`${id}: no published base, skipped`)
    continue
  }
  const {_rev, _createdAt, _updatedAt, ...rest} = published as Record<string, unknown>
  await x.createIfNotExists({...rest, _id: `drafts.${id}`} as never)
  console.log(`${id}: base draft in place`)
}
