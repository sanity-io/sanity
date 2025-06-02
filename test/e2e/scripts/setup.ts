import {startTimer} from '../../../scripts/utils/startTimer'
import {readEnv} from '../envVars'
import {createE2EClient} from './e2eClient'

const SANITY_E2E_DATASET = readEnv('SANITY_E2E_DATASET')
const studioE2EClient = createE2EClient(SANITY_E2E_DATASET)

const datasetName = SANITY_E2E_DATASET

studioE2EClient.datasets.list().then(async (datasets) => {
  // If the dataset doesn't exist, create it
  if (!datasets.find((ds) => ds.name === datasetName)) {
    const timer = startTimer(`Creating dataset ${datasetName}`)
    await studioE2EClient.datasets.create(datasetName, {
      aclMode: 'public',
    })
    timer.end()
  }
})
