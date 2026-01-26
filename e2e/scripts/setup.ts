import {startTimer, sanityIdify} from '@repo/utils'
import {readEnv} from '../envVars'
import {createE2EClient} from './e2eClient'

const dataset = sanityIdify(readEnv('SANITY_E2E_DATASET'))

const studioE2EClient = createE2EClient(readEnv('SANITY_E2E_DATASET'))

void studioE2EClient.datasets.list().then(async (datasets) => {
  // If the dataset doesn't exist, create it
  if (!datasets.find((ds) => ds.name === dataset)) {
    const timer = startTimer(`Creating dataset ${dataset}`)
    await studioE2EClient.datasets.create(dataset, {
      aclMode: 'public',
    })
    timer.end()
  }
})
