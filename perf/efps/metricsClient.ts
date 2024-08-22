// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

import {createClient} from '@sanity/client'

export const metricsClient = createClient({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  projectId: process.env.METRICS_SANITY_PROJECT_ID,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  dataset: process.env.METRICS_SANITY_DATASET,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  token: process.env.METRICS_SANITY_TOKEN,
  apiVersion: '2023-02-03',
  useCdn: false,
})
