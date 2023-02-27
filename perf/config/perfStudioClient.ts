import {createClient} from '@sanity/client'
import {readEnv} from './envVars'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './constants'

/**
 * This is the client for the "performance studio"
 * which is used to run performance tests agains
 */
export const perfStudioClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET,
  token: readEnv('PERF_TEST_SANITY_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})
