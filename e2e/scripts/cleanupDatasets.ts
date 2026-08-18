/**
 * Periodic cleanup of e2e datasets.
 *
 * Handles three types of datasets:
 * - PR datasets (`pr-<number>-<browser>-<run-id>`): deleted when the PR is closed
 * - Main datasets (`main-<browser>-<run-id>`): deleted when older than 24 hours
 * - Agent datasets (`cursor_ci_<random>`): deleted when older than 24 hours
 *
 * Runs on a schedule (every 6 hours) and can be triggered manually.
 */

import {readEnv} from '../envVars'

const SANITY_E2E_PROJECT_ID = readEnv('SANITY_E2E_PROJECT_ID')
const SANITY_E2E_SESSION_TOKEN = readEnv('SANITY_E2E_SESSION_TOKEN')

// GITHUB_TOKEN is provided automatically in GitHub Actions
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'sanity-io/sanity'

const API_BASE_URL = `https://${SANITY_E2E_PROJECT_ID}.api.sanity.work/v2026-03-03`

const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

interface Dataset {
  name: string
  createdAt: string
  addonFor: string | null
}

// Match dataset names like `pr-12225-chromium-22576482973`
const PR_DATASET_PATTERN = /^pr-(\d+)-/
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
  if (!res.ok) throw new Error(`Failed to delete "${name}": ${res.statusText}`)
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

async function cleanupPrDatasets(datasets: Dataset[]): Promise<number> {
  const prDatasets = datasets.filter(
    (ds) => PR_DATASET_PATTERN.test(ds.name) && !ds.name.endsWith('-comments'),
  )

  console.log(`Found ${prDatasets.length} PR datasets total`)

  const datasetsByPr = new Map<number, Dataset[]>()
  for (const ds of prDatasets) {
    const match = ds.name.match(PR_DATASET_PATTERN)
    if (match) {
      const prNumber = parseInt(match[1], 10)
      const existing = datasetsByPr.get(prNumber) || []
      existing.push(ds)
      datasetsByPr.set(prNumber, existing)
    }
  }

  console.log(`Datasets belong to ${datasetsByPr.size} unique PRs`)

  const openPrs = await fetchOpenPrNumbers()
  console.log(`Found ${openPrs.size} open PRs in ${GITHUB_REPO}`)

  let deletedCount = 0

  for (const [prNumber, prDatasetsGroup] of datasetsByPr) {
    if (openPrs.has(prNumber)) {
      console.log(`PR #${prNumber} is open, skipping ${prDatasetsGroup.length} dataset(s)`)
      continue
    }

    console.log(`PR #${prNumber} is closed, deleting ${prDatasetsGroup.length} dataset(s)`)

    for (const ds of prDatasetsGroup) {
      try {
        await deleteDataset(ds.name)
        console.log(`  Deleted: ${ds.name}`)
        deletedCount++
      } catch (err) {
        console.error(`  Failed to delete ${ds.name}: ${err}`)
      }
    }
  }

  return deletedCount
}

async function cleanupExpiredDatasets(
  datasets: Dataset[],
  {label, pattern}: {label: string; pattern: RegExp},
): Promise<number> {
  const now = Date.now()
  const matchingDatasets = datasets.filter((ds) => pattern.test(ds.name))

  console.log(`Found ${matchingDatasets.length} ${label} datasets total`)

  let deletedCount = 0

  for (const ds of matchingDatasets) {
    const age = now - new Date(ds.createdAt).getTime()
    if (age < MAX_AGE_MS) {
      console.log(`  Skipping ${ds.name} (${Math.round(age / 3600000)}h old)`)
      continue
    }

    try {
      await deleteDataset(ds.name)
      console.log(`  Deleted: ${ds.name} (${Math.round(age / 3600000)}h old)`)
      deletedCount++
    } catch (err) {
      console.error(`  Failed to delete ${ds.name}: ${err}`)
    }
  }

  return deletedCount
}

async function run() {
  const datasets = await listDatasets()

  const prDeleted = await cleanupPrDatasets(datasets)
  const mainDeleted = await cleanupExpiredDatasets(datasets, {
    label: 'main',
    pattern: MAIN_DATASET_PATTERN,
  })
  const agentDeleted = await cleanupExpiredDatasets(datasets, {
    label: 'agent',
    pattern: AGENT_DATASET_PATTERN,
  })

  console.log(
    `\nCleanup complete. Deleted ${prDeleted} PR dataset(s), ${mainDeleted} main dataset(s) and ${agentDeleted} agent dataset(s).`,
  )
}

run().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
