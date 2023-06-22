import {createClient} from '@sanity/client'
import {STUDIO_DATASET_NAME, STUDIO_PROJECT_ID, STUDIO_API_VERSION} from './constants'

export const testSanityClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET_NAME,
  token: process.env.SANITY_E2E_SESSION_TOKEN,
  useCdn: false,
  apiVersion: STUDIO_API_VERSION,
})
