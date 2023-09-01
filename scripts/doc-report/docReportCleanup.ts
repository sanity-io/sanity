import {sanityIdify} from '../utils/sanityIdify'
import {createDocClient} from './docClient'
import {readEnv} from 'sanity-perf-tests/config/envVars'

const DATASET = readEnv('DOCS_REPORT_DATASET')
const studioMetricsClient = createDocClient(DATASET)

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
    console.error(`Something went wrong! ${err?.response?.body?.message}`)
  })
