import {createClient} from '@sanity/client'
import {readEnv} from './envVars'

export const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: 'production',
  token: readEnv('PERF_TEST_METRICS_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})
