import {createClient} from '@sanity/client'
import {getEnv} from '../utils/env'

export const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: 'production',
  token: getEnv('PERF_TEST_METRICS_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})
