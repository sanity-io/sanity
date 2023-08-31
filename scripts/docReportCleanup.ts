import {createClient} from '@sanity/client'
import {sanityIdify} from './utils/sanityIdify'
import {readEnv} from 'sanity-perf-tests/config/envVars'

const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: sanityIdify(readEnv('DOCS_REPORT_DATASET')),
  token: readEnv('DOCS_REPORT_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})

studioMetricsClient.datasets
  .delete(sanityIdify(readEnv('DOCS_REPORT_DATASET')))
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
