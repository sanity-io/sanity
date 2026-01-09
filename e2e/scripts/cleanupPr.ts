/* eslint-disable no-console */
import {readEnv} from '../envVars'
import {createE2EClient} from './e2eClient'
import {startTimer} from '@repo/utils'

const prNumber = readEnv('PR_NUMBER')
const studioE2EClient = createE2EClient('production')

async function cleanupPr() {
  const datasets = await studioE2EClient.datasets.list()
  // gets all the datasets that belong to the PR but not the ones associated with comments
  // since those will be removed automatically
  const prDatasets = datasets.filter(
    (ds) => ds.name.startsWith(`pr-${prNumber}-`) && !ds.name.endsWith('-comments'),
  )

  console.log(`Found ${prDatasets.length} datasets to clean up`)

  for (const dataset of prDatasets) {
    const timer = startTimer(`Deleting dataset ${dataset.name}`)
    await studioE2EClient.datasets
      .delete(dataset.name)
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

    timer.end()
  }

  console.log('PR cleanup complete')
}

cleanupPr().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
