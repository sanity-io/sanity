/* eslint-disable no-console */
/**
 * Periodic cleanup of e2e datasets for closed/merged PRs.
 *
 * Lists all datasets in the e2e project, extracts the PR number from dataset names
 * matching the pattern `pr-<number>-<browser>-<run-id>`, checks if the corresponding
 * PR is closed via the GitHub API, and deletes datasets for closed PRs.
 *
 * This replaces the previous approach of only cleaning up on PR close events,
 * which could fail and leave dangling datasets.
 */

import {readEnv} from '../envVars'

const SANITY_E2E_PROJECT_ID = readEnv('SANITY_E2E_PROJECT_ID')
const SANITY_E2E_SESSION_TOKEN = readEnv('SANITY_E2E_SESSION_TOKEN')

// GITHUB_TOKEN is provided automatically in GitHub Actions
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'sanity-io/sanity'

const API_BASE_URL = `https://${SANITY_E2E_PROJECT_ID}.api.sanity.work/v2026-03-03`

interface Dataset {
  name: string
  createdAt: string
  addonFor: string | null
}

// Match dataset names like `pr-12225-chromium-22576482973`
const PR_DATASET_PATTERN = /^pr-(\d+)-/

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

async function isPrOpen(prNumber: number): Promise<boolean> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}`, {
    headers,
  })

  if (!res.ok) {
    if (res.status === 404) {
      // PR doesn't exist, treat as closed
      return false
    }
    throw new Error(`Failed to check PR #${prNumber}: ${res.status} ${res.statusText}`)
  }

  const pr = (await res.json()) as {state: string}
  return pr.state === 'open'
}

async function run() {
  const datasets = await listDatasets()

  // Find all PR datasets (excluding comment datasets which are auto-deleted)
  const prDatasets = datasets.filter(
    (ds) => PR_DATASET_PATTERN.test(ds.name) && !ds.name.endsWith('-comments'),
  )

  console.log(`Found ${prDatasets.length} PR datasets total`)

  // Group datasets by PR number to minimize GitHub API calls
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

  let deletedCount = 0

  for (const [prNumber, prDatasetsGroup] of datasetsByPr) {
    const open = await isPrOpen(prNumber)

    if (open) {
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

  console.log(`\nCleanup complete. Deleted ${deletedCount} dataset(s).`)
}

run().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
