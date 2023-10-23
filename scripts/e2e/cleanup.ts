import {sanityIdify} from '../utils/sanityIdify'
import {startTimer} from '../utils/startTimer'
import {readEnv} from '../utils/envVars'
import {KnownEnvVar, createE2EClient} from './e2eClient'

const DATASET = readEnv<KnownEnvVar>('SANITY_E2E_DATASET')
const studioE2EClient = createE2EClient(DATASET)

const timer = startTimer(`Deleting dataset ${DATASET}`)

studioE2EClient.datasets
  .delete(sanityIdify(DATASET))
  .then((res) => {
    if (res.deleted) {
      console.log('Deleted dataset')
    } else {
      console.log('Dataset was not deleted')
    }
  })
  .catch((err) => {
    throw new Error(`Something went wrong! ${err?.response?.body?.message}`)
  })
  .finally(() => {
    timer.end()
  })
