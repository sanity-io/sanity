
import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'

import  {type KnownEnvVar} from './types'

export const client = createClient({
  projectId: readEnv<KnownEnvVar>('SANITY_PROJECT_ID'),
  dataset: readEnv<KnownEnvVar>('SANITY_DATASET'),
  token: JSON.parse(readEnv<KnownEnvVar>('SANITY_TOKEN')),
})
