import {createClient} from '@sanity/client'
import {getEnv} from './getEnv'

export const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: 'production',
  token: getEnv('METRICS_WRITE_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})
