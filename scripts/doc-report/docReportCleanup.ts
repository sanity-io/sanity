import {sanityIdify} from '../utils/sanityIdify'
import {startTimer} from '../utils/startTimer'
import {readEnv} from '../utils/envVars'
import {KnownEnvVar, createDocClient} from './docClient'

const DATASET = readEnv<KnownEnvVar>('DOCS_REPORT_DATASET')
const studioMetricsClient = createDocClient(DATASET)

const timer = startTimer(`Deleting dataset ${DATASET}`)

studioMetricsClient.datasets
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
