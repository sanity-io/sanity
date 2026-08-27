// oxlint-disable no-console
/**
 * Sync git history into the metrics dataset as `gitCommit` / `gitTag`
 * documents. Run by .github/workflows/sync-git-metrics.yml on pushes to main
 * and after releases; `--all` backfills from the v5.0.0 cutoff.
 *
 * Stateless and idempotent: deterministic ids + createOrReplace mean every
 * run blindly re-upserts its window — overlap is free, a failed run is
 * repaired by the next one. Collection is fail-loud: a GitHub or npm API
 * error aborts before anything is written (failing the workflow, which
 * alerts Slack). Documents are replaced whole, so a run never writes what it
 * could not collect — see assembleSyncDocuments for the rules.
 *
 *   pnpm --filter radar sync-git -- --dry-run        # preview, nothing written
 *   pnpm --filter radar sync-git -- --all --dry-run  # backfill preview
 *   pnpm --filter radar sync-git                     # last 50 commits
 *
 * Requires RADAR_SANITY_WRITE_TOKEN (same secret `bench store` uses) unless
 * --dry-run. Without GITHUB_TOKEN even a preview assembles zero commits —
 * every commit the GitHub lookup did not cover is filtered out.
 */
import {execFileSync} from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'
import {createClient, type IdentifiedSanityDocumentStub} from '@sanity/client'

import {
  assembleSyncDocuments,
  COMMIT_LOG_FORMAT,
  commitDocument,
  type GitCommitDocument,
  type GitHubCollection,
  type GitTagDocument,
  parseCommitRecords,
  parseTagRefs,
  TAG_REF_FORMAT,
  tagDocument,
} from './gitHistory'
import {
  buildDeploymentsQuery,
  type CommitGitHubInfo,
  GITHUB_DEPLOYMENTS_BATCH_SIZE,
  parseCommitGitHubInfo,
} from './githubDeployments'
import {npmInfoForTags, type NpmVersionInfo} from './npmVersions'

/** The Studio Radar project — same constants as perf/bench/report/storeToSanity.ts. */
const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

/** Backfill start: the dataset deliberately covers v5.0.0 (2025-12-16) onward. */
const BACKFILL_CUTOFF_TAG = 'v5.0.0'

/**
 * Incremental window: one GitHub GraphQL batch, ~2 days of main. Failures
 * alert Slack the same day; a longer gap takes one `--all` dispatch.
 */
const DEFAULT_MAX_COUNT = 50

/** ~300 sub-400-byte docs per transaction ≈ 100 KB bodies, ~7 requests on backfill. */
const MUTATIONS_PER_TRANSACTION = 300

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/** Fail-loud git — a bad ref or shallow clone must abort, not store a partial window. */
function git(args: string[]): string {
  return execFileSync('git', args, {cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024})
}

function collectDocuments(options: {all: boolean; maxCount: number; ref: string}): {
  commits: GitCommitDocument[]
  tags: GitTagDocument[]
} {
  // ^.. includes the cutoff commit itself (gitTag-v5.0.0's reference would
  // otherwise dangle); --first-parent is the chain parentSha promises.
  // Refs go after --end-of-options so a hostile --ref can't become a flag.
  const logArgs = options.all
    ? [
        'log',
        '--first-parent',
        `--format=${COMMIT_LOG_FORMAT}`,
        '--end-of-options',
        `${BACKFILL_CUTOFF_TAG}^..${options.ref}`,
      ]
    : [
        'log',
        '--first-parent',
        `--max-count=${options.maxCount}`,
        `--format=${COMMIT_LOG_FORMAT}`,
        '--end-of-options',
        options.ref,
      ]
  const commits = parseCommitRecords(git(logArgs)).map(commitDocument)
  const tags = parseTagRefs(git(['for-each-ref', 'refs/tags', `--format=${TAG_REF_FORMAT}`])).map(
    tagDocument,
  )
  return {commits, tags}
}

/**
 * Per-commit GitHub enrichment: test-studio deploy URL (from deployment
 * statuses — Vercel builds every commit, we only collect) and the author's
 * GitHub login/avatar. An API error aborts the run; a commit with no
 * deployment is NOT an error — the push-triggered run usually precedes its
 * own Vercel build, and the trailing window fills the URL in next run. The
 * one fail-soft path is a missing GITHUB_TOKEN (deliberate local mode):
 * commits are then skipped entirely, since writing them would erase
 * enrichment.
 */
async function collectGitHubInfo(shas: string[]): Promise<GitHubCollection> {
  const token = process.env.GITHUB_TOKEN
  const info = new Map<string, CommitGitHubInfo>()
  const queriedShas = new Set<string>()
  if (!token) {
    console.warn(
      'GITHUB_TOKEN not set — commits are skipped entirely (writing them would erase enrichment)',
    )
    return {info, queriedShas}
  }
  for (let offset = 0; offset < shas.length; offset += GITHUB_DEPLOYMENTS_BATCH_SIZE) {
    const batch = shas.slice(offset, offset + GITHUB_DEPLOYMENTS_BATCH_SIZE)
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {'authorization': `bearer ${token}`, 'content-type': 'application/json'},
      body: JSON.stringify({query: buildDeploymentsQuery(batch)}),
    })
    if (!response.ok) throw new Error(`GitHub GraphQL responded ${response.status}`)
    const payload = (await response.json()) as {data?: unknown; errors?: {message: string}[]}
    if (payload.errors?.length) throw new Error(payload.errors[0].message)
    for (const [sha, entry] of parseCommitGitHubInfo(payload.data, batch)) info.set(sha, entry)
    for (const sha of batch) queriedShas.add(sha)
  }
  return {info, queriedShas}
}

/**
 * npm enrichment for the release tags (publish time, current dist-tags,
 * weekly downloads). Only runs with --npm — the workflow requests it on
 * releases, the daily cron, and dispatches, not on every main push. npm
 * being down aborts the run before anything is written.
 */
async function collectNpmInfo(tagNames: string[]): Promise<Map<string, NpmVersionInfo>> {
  const get = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url} responded ${response.status}`)
    return response.json()
  }
  try {
    const [distTags, packument, downloads] = await Promise.all([
      get('https://registry.npmjs.org/-/package/sanity/dist-tags') as Promise<
        Record<string, string>
      >,
      get('https://registry.npmjs.org/sanity') as Promise<{time?: Record<string, string>}>,
      get('https://api.npmjs.org/versions/sanity/last-week') as Promise<{
        downloads?: Record<string, number>
      }>,
    ])
    return npmInfoForTags(tagNames, {
      distTags,
      time: packument.time,
      downloads: downloads.downloads,
    })
  } catch (error) {
    // Name the culprit subsystem; the `cause` chain keeps undici's
    // network-level reason visible
    throw new Error('npm enrichment failed', {cause: error})
  }
}

async function main(): Promise<void> {
  const {values} = parseArgs({
    // pnpm forwards the `--` separator verbatim, and parseArgs would demote
    // everything after it to (disallowed) positionals
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      'all': {type: 'boolean', default: false},
      'max-count': {type: 'string', default: String(DEFAULT_MAX_COUNT)},
      'ref': {type: 'string', default: 'origin/main'},
      'npm': {type: 'boolean', default: false},
      'dry-run': {type: 'boolean', default: false},
    },
  })

  const collected = collectDocuments({
    all: values.all,
    maxCount: Number(values['max-count']),
    ref: values.ref,
  })
  const github = await collectGitHubInfo(collected.commits.map((commit) => commit.sha))
  const npmInfo = values.npm
    ? await collectNpmInfo(collected.tags.map((tag) => tag.tag))
    : undefined
  const assembled = assembleSyncDocuments({
    commits: collected.commits,
    tags: collected.tags,
    github,
    ...(npmInfo ? {npmInfo} : {}),
  })
  const documents: IdentifiedSanityDocumentStub[] = assembled.documents
  console.log(
    `Assembled ${assembled.commitCount} commit(s) (${values.all ? `${BACKFILL_CUTOFF_TAG}^..${values.ref}` : `last ${values['max-count']} on ${values.ref}`}` +
      (assembled.skippedCommitCount > 0
        ? `, ${assembled.skippedCommitCount} skipped: GitHub lookup missing`
        : '') +
      `) and ${assembled.tagCount} tag(s)` +
      (values.npm ? ` with npm info for ${npmInfo?.size ?? 0}` : ' (tags need --npm)') +
      `; deploy URLs on ${assembled.urlCount} commit(s)`,
  )

  if (values['dry-run']) {
    const samples = [documents[0], documents.at(-1)].filter(Boolean)
    console.log(`Dry run — would upsert ${documents.length} document(s). Samples:`)
    for (const sample of samples) console.log(JSON.stringify(sample, null, 2))
    return
  }

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readEnv('RADAR_SANITY_WRITE_TOKEN'),
    useCdn: false,
  })

  for (let offset = 0; offset < documents.length; offset += MUTATIONS_PER_TRANSACTION) {
    const batch = documents.slice(offset, offset + MUTATIONS_PER_TRANSACTION)
    let transaction = client.transaction()
    for (const doc of batch) transaction = transaction.createOrReplace(doc)
    await transaction.commit()
    console.log(`Upserted ${Math.min(offset + batch.length, documents.length)}/${documents.length}`)
  }
  console.log(`Synced ${assembled.commitCount} commit(s) + ${assembled.tagCount} tag(s)`)
}

await main()
