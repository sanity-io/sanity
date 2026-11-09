/**
 * Periodic cleanup of e2e datasets.
 *
 * Handles three types of datasets:
 * - PR datasets (`pr-<number>-<browser>-<run-id>`): deleted when the PR is closed.
 *   An open PR keeps every dataset from its latest run id and deletes the earlier
 *   runs. `-comments` addons are not deleted directly; removing the dataset they
 *   attach to removes them.
 * - Main datasets (`main-<browser>-<run-id>`): deleted when older than 24 hours
 * - Agent datasets (`cursor_ci_<random>`): deleted when older than 24 hours
 *
 * Runs on a schedule (every 6 hours) and can be triggered manually.
 */

import {readEnv} from '../envVars'
import {parsePrDataset, planPrDatasetCleanup, type PrDataset} from './prDatasetCleanup'

const SANITY_E2E_PROJECT_ID = readEnv('SANITY_E2E_PROJECT_ID')
const SANITY_E2E_SESSION_TOKEN = readEnv('SANITY_E2E_SESSION_TOKEN')

// GITHUB_TOKEN is provided automatically in GitHub Actions
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'sanity-io/sanity'

const API_BASE_URL = `https://${SANITY_E2E_PROJECT_ID}.api.sanity.work/v2026-03-03`

const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

type Dataset = PrDataset

interface CleanupCounts {
  deleted: number
  skipped: number
}

// Names like `pr-12225-extra` match none of the run patterns and are left alone.
const UNRECOGNIZED_PR_DATASET_PATTERN = /^pr-\d+-/
// Match dataset names like `main-chromium-22576482973`
const MAIN_DATASET_PATTERN = /^main-(chromium|firefox)-/
// Match dataset names like `cursor_ci_f167bd`, created by agents running the
// suite from a Cursor Cloud VM (see AGENTS.md). They are meant to be deleted by
// whoever created them; this is the backstop for the ones that are not.
const AGENT_DATASET_PATTERN = /^cursor_ci_/

async function listDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE_URL}/datasets?tag=studio-e2e-cleanup`, {
    headers: {Authorization: `Bearer ${SANITY_E2E_SESSION_TOKEN}`},
  })
  if (!res.ok) throw new Error(`Failed to list datasets: ${res.statusText}`)
  return res.json()
}

async function deleteDataset(name: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/datasets/${name}?tag=studio-e2e-cleanup`, {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${SANITY_E2E_SESSION_TOKEN}`},
  })
  if (!res.ok) {
    const body = (await res.text()).trim()
    const detail = body
      ? `${res.status} ${res.statusText}: ${body}`
      : `${res.status} ${res.statusText}`
    throw new Error(`Failed to delete "${name}": ${detail}`)
  }
}

async function fetchOpenPrNumbers(): Promise<Set<number>> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  const openPrs = new Set<number>()
  let page = 1

  // Paginate through all open PRs
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/pulls?state=open&per_page=100&page=${page}`,
      {headers},
    )

    if (!res.ok) {
      throw new Error(`Failed to list open PRs (page ${page}): ${res.status} ${res.statusText}`)
    }

    const prs = (await res.json()) as {number: number}[]
    for (const pr of prs) {
      openPrs.add(pr.number)
    }

    if (prs.length < 100) break
    page++
  }

  return openPrs
}

function datasetAgeMs(dataset: Dataset, now: number): number {
  return now - new Date(dataset.createdAt).getTime()
}

function formatAgeHours(ageMs: number): number {
  return Math.round(ageMs / 3_600_000)
}

function formatCreatedAtRange(datasets: Dataset[]): string {
  const created = datasets
    .map((ds) => ds.createdAt)
    .filter(Boolean)
    .sort()
  if (created.length === 0) return 'createdAt unknown'
  if (created[0] === created[created.length - 1]) return `created ${created[0]}`
  return `created ${created[0]} – ${created[created.length - 1]}`
}

async function deleteDatasets(datasets: Dataset[]): Promise<number> {
  let deletedCount = 0

  for (const ds of datasets) {
    try {
      await deleteDataset(ds.name)
      console.log(`  Deleted: ${ds.name} (created ${ds.createdAt})`)
      deletedCount++
    } catch (err) {
      console.error(`  Failed to delete ${ds.name}: ${err}`)
    }
  }

  return deletedCount
}

async function cleanupPrDatasets(datasets: Dataset[]): Promise<CleanupCounts> {
  const recognized = datasets.filter((ds) => {
    const parsed = parsePrDataset(ds)
    return parsed !== undefined && !parsed.comments
  })
  const unrecognized = datasets.filter(
    (ds) => UNRECOGNIZED_PR_DATASET_PATTERN.test(ds.name) && !parsePrDataset(ds),
  )

  console.log(`Found ${recognized.length} PR datasets total`)
  if (unrecognized.length > 0) {
    console.log(`Leaving ${unrecognized.length} unrecognized PR dataset name(s) in place`)
  }

  const openPrs = await fetchOpenPrNumbers()
  console.log(`Found ${openPrs.size} open PRs in ${GITHUB_REPO}`)

  const plans = planPrDatasetCleanup(recognized, openPrs)
  console.log(`Datasets belong to ${plans.length} unique PRs`)

  let deletedCount = 0
  let skippedCount = 0

  for (const plan of plans) {
    skippedCount += plan.keep.length

    if (!plan.open) {
      console.log(
        `PR #${plan.prNumber} is closed, deleting ${plan.delete.length} dataset(s) (${formatCreatedAtRange(plan.delete)})`,
      )
      deletedCount += await deleteDatasets(plan.delete)
      continue
    }

    const kept = `keeping ${plan.keep.length} dataset(s) from run ${plan.latestRunId} (${formatCreatedAtRange(plan.keep)})`
    if (plan.delete.length === 0) {
      console.log(`PR #${plan.prNumber} is open, ${kept}`)
      continue
    }

    console.log(
      `PR #${plan.prNumber} is open, ${kept}, deleting ${plan.delete.length} dataset(s) from older runs (${formatCreatedAtRange(plan.delete)})`,
    )
    deletedCount += await deleteDatasets(plan.delete)
  }

  console.log(`PR datasets: deleted ${deletedCount}, kept ${skippedCount}`)

  return {deleted: deletedCount, skipped: skippedCount}
}

async function cleanupExpiredDatasets(
  datasets: Dataset[],
  {label, pattern}: {label: string; pattern: RegExp},
): Promise<CleanupCounts> {
  const now = Date.now()
  const matchingDatasets = datasets.filter((ds) => pattern.test(ds.name))

  console.log(`Found ${matchingDatasets.length} ${label} datasets total`)

  let deletedCount = 0
  let skippedCount = 0

  for (const ds of matchingDatasets) {
    const age = datasetAgeMs(ds, now)
    if (age < MAX_AGE_MS) {
      console.log(`  Skipping ${ds.name} (${formatAgeHours(age)}h old)`)
      skippedCount++
      continue
    }

    try {
      await deleteDataset(ds.name)
      console.log(`  Deleted: ${ds.name} (${formatAgeHours(age)}h old)`)
      deletedCount++
    } catch (err) {
      console.error(`  Failed to delete ${ds.name}: ${err}`)
    }
  }

  console.log(`${label} datasets: deleted ${deletedCount}, skipped ${skippedCount}`)

  return {deleted: deletedCount, skipped: skippedCount}
}

async function run() {
  const datasets = await listDatasets()

  const pr = await cleanupPrDatasets(datasets)
  const main = await cleanupExpiredDatasets(datasets, {
    label: 'main',
    pattern: MAIN_DATASET_PATTERN,
  })
  const agent = await cleanupExpiredDatasets(datasets, {
    label: 'agent',
    pattern: AGENT_DATASET_PATTERN,
  })

  const deleted = pr.deleted + main.deleted + agent.deleted
  const skipped = pr.skipped + main.skipped + agent.skipped

  console.log(
    `\nCleanup complete. Deleted ${deleted} dataset(s) and skipped ${skipped}: ${pr.deleted} PR deleted (${pr.skipped} kept), ${main.deleted} main deleted (${main.skipped} skipped) and ${agent.deleted} agent deleted (${agent.skipped} skipped).`,
  )
}

run().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
