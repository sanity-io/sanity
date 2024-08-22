// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

import {createClient} from '@sanity/client'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const projectId = process.env.VITE_PERF_EFPS_PROJECT_ID
// eslint-disable-next-line turbo/no-undeclared-env-vars
const dataset = process.env.VITE_PERF_EFPS_DATASET
// eslint-disable-next-line turbo/no-undeclared-env-vars
const token = process.env.PERF_EFPS_SANITY_TOKEN

export const testClient = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: 'v2024-08-08',
})
