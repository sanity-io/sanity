import createClient from '@sanity/client'
import {getEnv} from './utils/getEnv'

const writeToken = getEnv('PERF_STUDIO_SANITY_WRITE_TOKEN')

export const sanityClient = createClient({
  token: writeToken,
  projectId: 'ppsg7ml5',
  dataset: 'metrics',
  useCdn: false,
})
