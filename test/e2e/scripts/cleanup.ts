/* eslint-disable no-console */
import {SANITY_E2E_PROJECT_ID, SANITY_E2E_SESSION_TOKEN} from '../env'

const API_BASE_URL = `https://${SANITY_E2E_PROJECT_ID}.api.sanity.work/v2025-05-22`

interface Dataset {
  name: string
  createdAt: string
  addonFor: string | null
}

// If the dataset is older than this, delete it
const DATASET_MAX_AGE = 1000 * 60 * 60

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
      !dataset.name.endsWith('-comments')
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
