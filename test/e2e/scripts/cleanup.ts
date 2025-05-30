/* eslint-disable no-console */
/* eslint-disable no-process-env */
/* eslint-disable no-process-exit */

import {loadEnvFiles} from '../../../scripts/utils/loadEnvFiles'

loadEnvFiles()

const SANITY_E2E_SESSION_TOKEN = process.env.SANITY_E2E_SESSION_TOKEN!
const SANITY_E2E_PROJECT_ID = process.env.SANITY_E2E_PROJECT_ID!
const SANITY_E2E_DATASET_STAGING = process.env.SANITY_E2E_DATASET_STAGING!

function validateEnvVar(name: string, value: string | undefined): void {
  if (!value) {
    console.error(`Missing \`${name}\` environment variable.`)
    console.error('See `test/e2e/README.md` for details.')
    process.exit(1)
  }
}

validateEnvVar('SANITY_E2E_SESSION_TOKEN', SANITY_E2E_SESSION_TOKEN)
validateEnvVar('SANITY_E2E_PROJECT_ID', SANITY_E2E_PROJECT_ID)
validateEnvVar('SANITY_E2E_DATASET_STAGING', SANITY_E2E_DATASET_STAGING)

const API_BASE_URL = `https://${SANITY_E2E_PROJECT_ID}.api.sanity.work/v2025-05-22`

interface Dataset {
  name: string
  createdAt: string
  addonFor: string | null
}

// If the dataset is older than 14 days, delete it
const DATASET_MAX_AGE = 1000 * 60 * 60 * 24 * 14

// Fetch a list of all datasets for the project
async function listDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE_URL}/datasets?tag=studio-e2e-cleanup`, {
    headers: {Authorization: `Bearer ${SANITY_E2E_SESSION_TOKEN}`},
  })
  if (!res.ok) throw new Error(`Failed to get datasets: ${res.statusText}`)
  return await res.json()
}

// Delete a single dataset by name
async function deleteDataset(name: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/datasets/${name}?tag=studio-e2e-cleanup`, {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${SANITY_E2E_SESSION_TOKEN}`},
  })
  if (!res.ok) throw new Error(`Failed to delete "${name}": ${res.statusText}`)
}

async function run() {
  const datasets = await listDatasets()
  const toDelete: Dataset[] = []
  for (const dataset of datasets) {
    const createdAt = new Date(dataset.createdAt)
    if (
      new Date().getTime() - createdAt.getTime() > DATASET_MAX_AGE &&
      dataset.name.startsWith('pr-') &&
      !dataset.name.endsWith('-comments') &&
      dataset.name !== SANITY_E2E_DATASET_STAGING
    ) {
      toDelete.push(dataset)
    }
  }
  if (toDelete.length === 0) {
    console.log('No datasets to delete')
    return
  }
  console.log(`Deleting ${toDelete.length} old datasets...`)
  for (const dataset of toDelete) {
    try {
      await deleteDataset(dataset.name)
    } catch (error) {
      error.message = `Failed to delete dataset: ${dataset.name}: ${error.message}`
      throw error
    }
    console.log(`Deleted dataset: ${dataset.name}`)
  }
  console.log('Old datasets deleted successfully.')
}

run().catch(console.error)
