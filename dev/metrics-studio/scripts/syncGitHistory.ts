// oxlint-disable no-console
/**
 * Sync git history into the metrics dataset as `gitCommit` / `gitTag`
 * documents (schemaTypes/gitCommit.ts, gitTag.ts). Run by
 * .github/workflows/sync-git-metrics.yml on every push to main and on `v*`
 * tag pushes; `--all` backfills from the v5.0.0 cutoff.
 *
 * Stateless and idempotent: deterministic ids + createOrReplace mean the
 * default mode can blindly re-upsert the last N commits on every run —
 * overlap is free, and a failed run is repaired by the next push. No dataset
 * reads, only the write token. Collection is fail-loud: a GitHub or npm API
 * error aborts before anything is written and fails the workflow run (which
 * alerts Slack), so a persistent problem can't hide in green runs — and
 * re-running is always safe. Because documents are REPLACED whole, a run
 * never writes docs whose enrichment it could not collect (see
 * assembleSyncDocuments): commits without a GitHub lookup (no token) are
 * omitted, and tags are written only on --npm runs.
 *
 *   pnpm --filter metrics-studio sync-git -- --dry-run        # preview, nothing written
 *   pnpm --filter metrics-studio sync-git -- --all --dry-run  # backfill preview
 *   pnpm --filter metrics-studio sync-git                     # last 200 commits
 *
 * Requires BENCH_METRICS_WRITE_TOKEN (same secret `bench store` uses) unless
 * --dry-run. GITHUB_TOKEN is optional everywhere, but without it even a
 * preview assembles zero commits — the erasure rule below filters out
 * everything the GitHub lookup did not cover.
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

/** The metrics-studio project — same constants as perf/bench/report/storeToSanity.ts. */
const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

/** Backfill start: the dataset deliberately covers v5.0.0 (2025-12-16) onward. */
const BACKFILL_CUTOFF_TAG = 'v5.0.0'

/**
 * Incremental window. Generous vs. real push sizes so missed workflow runs
 * self-heal; a gap larger than this needs a `--all` dispatch.
 */
const DEFAULT_MAX_COUNT = 200

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
  // ^.. so the cutoff commit itself is included (gitTag-v5.0.0's reference
  // would otherwise dangle forever); --first-parent because that is the
  // chain the documents promise (parentSha) and the Bisect tool walks
  // Flags before --end-of-options, refs after — a hostile --ref value can
  // then never be parsed as an option
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
 * Look up what GitHub knows about each commit: the test-studio deploy URL
 * from deployment statuses (Vercel Git integration builds every commit; we
 * only collect) and the author's GitHub login (GitHub maps commit emails to
 * accounts — the studio uses it for real avatars where gravatar can't).
 *
 * Fail-loud like the git reads: an API error here aborts the run before
 * anything is written, the workflow's Slack alert fires, and a re-run (safe —
 * the sync is idempotent) covers it. A commit with no deployment is NOT an
 * error — the push-triggered run usually precedes its own push's Vercel
 * build, and the trailing window fills the URL in on the next run. The one
 * fail-soft path is a missing GITHUB_TOKEN (a deliberate local mode): commits
 * are skipped entirely, since writing them would erase enrichment.
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
 * weekly downloads). Only runs with --npm — releases are far rarer than
 * pushes, so the workflow requests this on tag pushes, the daily cron, and
 * dispatches, not on every main push. Fail-loud like the GitHub collection:
 * npm being down aborts the run before anything is written — Slack alert,
 * then re-run.
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
    // Rewrap so the abort names the culprit subsystem; Node prints the
    // `cause` chain (where undici hides the network-level reason) on exit
    throw new Error(`npm enrichment failed: ${error}`, {cause: error})
  }
}

async function main(): Promise<void> {
  const {values} = parseArgs({
    // pnpm forwards a `--` separator verbatim (`pnpm sync-git -- --all`), and
    // parseArgs would demote everything after it to (disallowed) positionals
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
    token: readEnv('BENCH_METRICS_WRITE_TOKEN'),
    useCdn: false,
  })

  for (let offset = 0; offset < documents.length; offset += MUTATIONS_PER_TRANSACTION) {
    const batch = documents.slice(offset, offset + MUTATIONS_PER_TRANSACTION)
    let transaction = client.transaction()
    for (const doc of batch) transaction = transaction.createOrReplace(doc)
    await transaction.commit()
    console.log(`Upserted ${Math.min(offset + batch.length, documents.length)}/${documents.length}`)
  }
  console.log(
    `Synced ${assembled.commitCount} commit(s) + ${assembled.tagCount} tag(s) to ${METRICS_PROJECT_ID}/${METRICS_DATASET}`,
  )
}

await main()
