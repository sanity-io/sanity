import {createClient} from '@sanity/client'
import {SANITY_E2E_SESSION_TOKEN} from '../env'
import {STALE_TEST_THRESHOLD_MS, STUDIO_DATASET_NAME, STUDIO_PROJECT_ID} from './constants'

export const testSanityClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET_NAME,
  token: SANITY_E2E_SESSION_TOKEN,
  useCdn: false,
  apiVersion: '2021-08-31',
})

export function deleteDocumentsForRun(
  typeName: string,
  runId: string
): {query: string; params: Record<string, unknown>} {
  const threshold = new Date(Date.now() - STALE_TEST_THRESHOLD_MS).toISOString()
  return {
    query: `*[_type == $typeName && (runId == $runId || _createdAt < "${threshold}")]`,
    params: {typeName, runId},
  }
}
