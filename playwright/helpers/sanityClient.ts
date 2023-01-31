import sanityClient from '@sanity/client'
import {STALE_TEST_THRESHOLD_MS} from './constants'

export const testSanityClient = sanityClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  token: process.env.PLAYWRIGHT_SANITY_SESSION_TOKEN,
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
