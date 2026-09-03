/**
 * E2E flake report: attributes recent failed "End-to-End Tests" workflow runs to platform
 * degradation vs test-side causes, using the Studio diagnostics captured on every failed
 * test attempt (see e2e/helpers/failureDiagnostics.ts) plus failed setup-job logs and
 * cross-branch failure clustering.
 *
 *   pnpm e2e:flake-report --days 7 --out flake-report.md --json flake-report.json
 *
 * Needs a GitHub token with `actions: read` (GITHUB_TOKEN / GH_TOKEN, or a `gh auth login`).
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {strFromU8, unzipSync} from 'fflate'

import {
  extractTestCaptures,
  keepTestsWithFailures,
  readBlobReportsFromArtifact,
  type TestCaptures,
} from './blobReport'
import {
  analyzeTests,
  classifyJobLog,
  classifyRun,
  DEFAULT_THRESHOLDS,
  findClusters,
} from './classify'
import {GitHubClient, resolveGitHubToken} from './github'
import {renderMarkdown} from './render'
import {
  type Artifact,
  type FlakeReport,
  type RunAnalysis,
  type SetupFailure,
  type TestAnalysis,
  type WorkflowJob,
  type WorkflowRun,
} from './types'

const PLAYWRIGHT_JOB_PATTERN = /^playwright-test \((\w+), (\d+), \d+\)$/
/** Aggregate gate jobs fail whenever a dependency failed; they carry no cause of their own. */
const AGGREGATE_JOBS = new Set([
  'E2E Status',
  'merge-reports',
  'deploy-report',
  'update-comment-on-failure',
])
// Shard artifacts carry failure videos and traces (tens of MB each) and are inflated in
// memory, so keep few of them in flight at once.
const DOWNLOAD_CONCURRENCY = 2
const RUN_CONCURRENCY = 2

interface Options {
  allShards: boolean
  cacheDir: string
  json?: string
  limit?: number
  out?: string
  repo: string
  since: Date
  workflow: string
}

function parseOptions(): Options | undefined {
  const {values} = parseArgs({
    options: {
      'all-shards': {default: false, type: 'boolean'},
      'cache-dir': {type: 'string'},
      'days': {default: '7', type: 'string'},
      'help': {default: false, type: 'boolean'},
      'json': {type: 'string'},
      'limit': {type: 'string'},
      'out': {type: 'string'},
      'repo': {default: process.env.GITHUB_REPOSITORY || 'sanity-io/sanity', type: 'string'},
      'since': {type: 'string'},
      'workflow': {default: 'e2e.yml', type: 'string'},
    },
  })

  if (values.help) {
    console.error(`Usage: pnpm e2e:flake-report [options]

  --days <n>         Look at runs created in the last n days (default 7)
  --since <iso>      Look at runs created at or after this timestamp (overrides --days)
  --limit <n>        Only analyze the newest n runs in the window
  --repo <o/r>       Repository (default GITHUB_REPOSITORY or sanity-io/sanity)
  --workflow <file>  Workflow file name (default e2e.yml)
  --all-shards       Also download green playwright-report shards of failed runs (runs that
                     predate the compact e2e-diagnostics artifacts) to include flaky attempts
  --out <file>       Write the markdown report here (always printed to stdout)
  --json <file>      Write the raw analysis as JSON
  --cache-dir <dir>  Where downloaded artifacts are cached (default: OS temp dir)`)
    return undefined
  }

  const days = Number(values.days)
  const since = values.since
    ? new Date(values.since)
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  if (Number.isNaN(since.getTime())) throw new Error(`Invalid --since / --days value`)

  return {
    allShards: values['all-shards'],
    cacheDir: values['cache-dir'] ?? path.join(os.tmpdir(), 'sanity-e2e-flake-report'),
    json: values.json,
    limit: values.limit ? Number(values.limit) : undefined,
    out: values.out,
    repo: values.repo,
    since,
    workflow: values.workflow,
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({length: items.length})
  let next = 0
  const workers = Array.from({length: Math.min(limit, items.length)}, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      // oxlint-disable-next-line no-await-in-loop -- bounded worker pool; each worker is sequential by design
      results[index] = await task(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Loads the failed-attempt captures of one shard artifact. Compact `e2e-diagnostics-*`
 * artifacts (written by extractDiagnostics.ts in CI) are read directly; older runs only
 * have the video-heavy `playwright-report-*` shard artifacts, whose blob reports are
 * parsed instead. Either way only the extracted captures are cached, never the zips.
 */
async function loadShardCaptures(
  client: GitHubClient,
  artifact: Artifact,
  cacheDir: string,
): Promise<TestCaptures[]> {
  const cachePath = path.join(cacheDir, `artifact-${artifact.id}.json`)
  try {
    return JSON.parse(await readFile(cachePath, 'utf8')) as TestCaptures[]
  } catch {
    // Not cached yet.
  }

  const bytes = await client.downloadArtifact(artifact.id)
  let tests: TestCaptures[]
  if (artifact.name.startsWith('e2e-diagnostics-')) {
    const files = unzipSync(bytes, {filter: (file) => file.name.endsWith('.json')})
    tests = Object.values(files).flatMap(
      (file) => (JSON.parse(strFromU8(file)) as {tests: TestCaptures[]}).tests,
    )
  } else {
    tests = keepTestsWithFailures(readBlobReportsFromArtifact(bytes).flatMap(extractTestCaptures))
  }

  await mkdir(cacheDir, {recursive: true})
  await writeFile(cachePath, JSON.stringify(tests))
  return tests
}

function shardFromArtifactName(name: string): string | undefined {
  const match = /^(?:playwright-report|e2e-diagnostics)-(\w+)-(\d+)$/.exec(name)
  return match ? `${match[1]}-${match[2]}` : undefined
}

async function analyzeFailedRun(
  client: GitHubClient,
  run: WorkflowRun,
  options: Options,
): Promise<RunAnalysis> {
  const [jobs, artifacts] = await Promise.all([
    client.listJobs(run.id),
    client.listArtifacts(run.id),
  ])
  const failedJobs = jobs.filter((job) => job.conclusion === 'failure')

  const failedShards = new Set(
    failedJobs
      .map((job) => PLAYWRIGHT_JOB_PATTERN.exec(job.name))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => `${match[1]}-${match[2]}`),
  )
  const available = artifacts.filter(
    (artifact) => !artifact.expired && shardFromArtifactName(artifact.name),
  )
  const compactShards = new Set(
    available
      .filter((artifact) => artifact.name.startsWith('e2e-diagnostics-'))
      .map((artifact) => shardFromArtifactName(artifact.name)),
  )
  const shardArtifacts = available.filter((artifact) => {
    const shard = shardFromArtifactName(artifact.name)!
    // Compact artifacts are cheap: take them all so flaky attempts on green shards count too.
    if (artifact.name.startsWith('e2e-diagnostics-')) return true
    if (compactShards.has(shard)) return false
    return options.allShards || failedShards.has(shard)
  })

  const tests = (
    await mapWithConcurrency(shardArtifacts, DOWNLOAD_CONCURRENCY, async (artifact) => {
      const shard = shardFromArtifactName(artifact.name)!
      try {
        return analyzeTests(shard, await loadShardCaptures(client, artifact, options.cacheDir))
      } catch (error) {
        console.error(
          `  ! run ${run.id} ${artifact.name}: ${error instanceof Error ? error.message : error}`,
        )
        return [] as TestAnalysis[]
      }
    })
  ).flat()

  const setupJobs = failedJobs.filter(
    (job) => !PLAYWRIGHT_JOB_PATTERN.test(job.name) && !AGGREGATE_JOBS.has(job.name),
  )
  const setupFailures = await mapWithConcurrency(
    setupJobs,
    DOWNLOAD_CONCURRENCY,
    async (job: WorkflowJob): Promise<SetupFailure> => {
      try {
        const {excerpt, signature} = classifyJobLog(await client.getJobLog(job.id))
        return {excerpt, job: job.name, signature, url: job.url}
      } catch {
        return {job: job.name, signature: 'other', url: job.url}
      }
    },
  )

  return classifyRun(run, jobs, tests, setupFailures)
}

async function main(): Promise<void> {
  const options = parseOptions()
  if (!options) return

  const client = new GitHubClient(options.repo, resolveGitHubToken())
  console.error(
    `Listing ${options.workflow} runs in ${options.repo} since ${options.since.toISOString()}…`,
  )
  let runs = await client.listWorkflowRuns(options.workflow, options.since)
  if (options.limit) runs = runs.slice(0, options.limit)

  const failedRuns = runs.filter(
    (run) => run.status === 'completed' && run.conclusion === 'failure',
  )
  console.error(
    `${runs.length} runs, ${failedRuns.length} failed. Downloading failed-shard reports…`,
  )

  let done = 0
  const failed = await mapWithConcurrency(failedRuns, RUN_CONCURRENCY, async (run) => {
    const analysis = await analyzeFailedRun(client, run, options)
    done += 1
    console.error(
      `  [${done}/${failedRuns.length}] run ${run.id} (${run.branch}) → ${analysis.verdict}`,
    )
    return analysis
  })

  const report: FlakeReport = {
    clusters: findClusters(failed),
    failed,
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    runs,
    since: options.since.toISOString(),
    thresholds: DEFAULT_THRESHOLDS,
    until: new Date().toISOString(),
    workflow: options.workflow,
  }

  const markdown = renderMarkdown(report)
  if (options.out) await writeFile(options.out, markdown)
  if (options.json) await writeFile(options.json, JSON.stringify(report, null, 2))
  console.log(markdown)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error)
  process.exitCode = 1
})
