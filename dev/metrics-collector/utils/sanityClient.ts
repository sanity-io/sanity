import createClient from '@sanity/client'
import {getEnv} from './getEnv'

const writeToken = getEnv('METRICS_WRITE_TOKEN')

export const sanityClient = createClient({
  token: writeToken,
  projectId: 'ppsg7ml5',
  dataset: 'metrics',
  apiVersion: '2021-05-07',
  useCdn: false,
})
