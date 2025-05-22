import {startTimer} from '../../../scripts/utils/startTimer'
import {SANITY_E2E_DATASET} from '../env'
import {createE2EClient} from './e2eClient'

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
