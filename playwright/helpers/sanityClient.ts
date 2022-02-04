import sanityClient from '@sanity/client'
import {DEFAULT_DATASET, STUDIO_PROJECT_ID} from '.'

export const testSanityClient = sanityClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: DEFAULT_DATASET,
  token: process.env.PLAYWRIGHT_SANITY_SESSION_TOKEN,
  useCdn: false,
})

export async function deleteDocument(payload) {
  return testSanityClient.delete(payload)
}
