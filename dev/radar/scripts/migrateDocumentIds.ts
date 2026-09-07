// oxlint-disable no-console
/**
 * One-off migration: move every document written under the old camelCase /
 * dotted ids to the ids `@repo/utils/radar-ids` builds today, and repoint the
 * weak `commit` references that named the old commit ids. The mapping itself
 * is documentIdMigration.ts (pure, unit tested); this file is the I/O.
 *
 * Why: a dot in an id makes it a path segment (`drafts.x`), which the API
 * scopes differently from top-level documents — `gitTag-v6.10.1` sat there by
 * accident. The other types follow for consistency (see radarIds.ts).
 *
 * Idempotent and order-independent: a document that already exists under its
 * new id is kept and the legacy copy deleted; a rerun finds nothing to move.
 * sync-git-metrics.yml runs it before every sync (so a new-id commit is never
 * written next to a legacy copy of the same sha); drop the step and this file
 * once a run reports zero legacy documents. Locally:
 *
 *   pnpm --filter radar migrate-ids -- --dry-run
 *
 * --dry-run still needs RADAR_SANITY_WRITE_TOKEN: the dataset is private, so
 * listing the legacy ids needs a token like any other query.
 */
import process from 'node:process'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'
import {gitCommitId} from '@repo/utils/radar-ids'
import {createClient, type SanityClient, type SanityDocument} from '@sanity/client'

import {
  LEGACY_PREFIXES,
  MIGRATED_TYPES,
  type MigratedType,
  migratedDocument,
} from './documentIdMigration'

const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

const FULL_SHA_RE = /^[0-9a-f]{40}$/

/** Documents per transaction: benchRun documents carry sample arrays and are large. */
const BATCH_SIZE: Record<MigratedType, number> = {
  benchRun: 5,
  gitCommit: 150,
  gitTag: 150,
  bisectSession: 50,
  driftAck: 50,
}

async function migrateType(
  client: SanityClient,
  type: MigratedType,
  dryRun: boolean,
): Promise<{moved: number; skipped: string[]}> {
  const legacyIds = await client.fetch<string[]>(
    '*[_type == $type && string::startsWith(_id, $prefix)]._id',
    {type, prefix: LEGACY_PREFIXES[type]},
  )
  console.log(`${type}: ${legacyIds.length} legacy document(s)`)
  const skipped: string[] = []
  let moved = 0

  for (let offset = 0; offset < legacyIds.length; offset += BATCH_SIZE[type]) {
    const ids = legacyIds.slice(offset, offset + BATCH_SIZE[type])
    const docs = await client.getDocuments<SanityDocument>(ids)
    let transaction = client.transaction()
    let queued = 0
    for (const [index, doc] of docs.entries()) {
      if (!doc) continue // deleted between listing and fetching — nothing to move
      const migration = migratedDocument(doc)
      if (!migration) {
        skipped.push(ids[index])
        continue
      }
      if (dryRun) {
        if (moved < 3)
          console.log(`  would move ${migration.legacyId} -> ${migration.document._id}`)
      } else {
        // createIfNotExists: a newer copy the sync already wrote under the new
        // id wins over the legacy one; the legacy copy goes either way
        transaction = transaction.createIfNotExists(migration.document).delete(migration.legacyId)
        queued += 1
      }
      moved += 1
    }
    // A batch can end up empty (every document skipped, or deleted between
    // listing and fetching); an empty transaction is a pointless request at
    // best and an API error at worst
    if (queued > 0) await transaction.commit()
    console.log(`  ${Math.min(offset + ids.length, legacyIds.length)}/${legacyIds.length}`)
  }
  return {moved, skipped}
}

/**
 * Documents already on new ids can still point at legacy commit ids through
 * their weak `commit` reference (a benchRun stored before this change, then
 * moved by an earlier partial run; a tag re-synced before deploy). Repoint
 * them from the sha, which stays the source of truth.
 */
async function repairCommitReferences(client: SanityClient, dryRun: boolean): Promise<number> {
  const stale = await client.fetch<{_id: string; path: string; sha: string | null}[]>(
    `*[_type in ["benchRun", "gitTag"] && (
        string::startsWith(git.commit._ref, $legacy) || string::startsWith(commit._ref, $legacy)
      )]{_id, "path": select(_type == "benchRun" => "git.commit", "commit"), "sha": coalesce(git.sha, sha)}`,
    {legacy: LEGACY_PREFIXES.gitCommit},
  )
  const patchable = stale.filter(
    (doc): doc is {_id: string; path: string; sha: string} =>
      !!doc.sha && FULL_SHA_RE.test(doc.sha),
  )
  console.log(`commit references: ${patchable.length} stale`)
  if (dryRun || patchable.length === 0) return patchable.length
  for (let offset = 0; offset < patchable.length; offset += 300) {
    let transaction = client.transaction()
    for (const doc of patchable.slice(offset, offset + 300)) {
      transaction = transaction.patch(doc._id, {
        set: {[doc.path]: {_type: 'reference', _ref: gitCommitId(doc.sha), _weak: true}},
      })
    }
    await transaction.commit()
  }
  return patchable.length
}

async function main(): Promise<void> {
  const {values} = parseArgs({
    // pnpm forwards a `--` separator verbatim; see syncGitHistory.ts
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {'dry-run': {type: 'boolean', default: false}},
  })
  const dryRun = values['dry-run']

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readEnv('RADAR_SANITY_WRITE_TOKEN'),
    useCdn: false,
  })

  let moved = 0
  const skipped: string[] = []
  // Commits first (MIGRATED_TYPES order): the moved tags and runs point at the
  // new commit ids, which should exist by the time anyone follows them
  for (const type of MIGRATED_TYPES) {
    const result = await migrateType(client, type, dryRun)
    moved += result.moved
    skipped.push(...result.skipped)
  }
  const repaired = await repairCommitReferences(client, dryRun)

  console.log(
    `${dryRun ? 'Would move' : 'Moved'} ${moved} document(s), ${
      dryRun ? 'would repair' : 'repaired'
    } ${repaired} reference(s)`,
  )
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} document(s) missing the fields their id derives from:`)
    for (const id of skipped) console.log(`  ${id}`)
    process.exitCode = 1
  }
}

await main()
