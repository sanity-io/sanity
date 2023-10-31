import {readEnv} from '../utils/envVars'
import {sanityIdify} from '../utils/sanityIdify'
import {startTimer} from '../utils/startTimer'
import {KnownEnvVar, createE2EClient} from './e2eClient'

const dataset = sanityIdify(readEnv<KnownEnvVar>('SANITY_E2E_DATASET'))

const studioE2EClient = createE2EClient(readEnv<KnownEnvVar>('SANITY_E2E_DATASET'))

studioE2EClient.datasets.list().then(async (datasets) => {
  // If the dataset doesn't exist, create it
  if (!datasets.find((ds) => ds.name === dataset)) {
    const timer = startTimer(`Creating dataset ${dataset}`)
    await studioE2EClient.datasets.create(dataset, {
      aclMode: 'public',
    })
    timer.end()
  }
})
