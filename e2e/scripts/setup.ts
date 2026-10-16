import {startTimer, sanityIdify} from '@repo/utils'

import {readEnv} from '../envVars'
import {createE2EClient} from './e2eClient'
import {withRateLimitRetry} from './rateLimitRetry'

const dataset = sanityIdify(readEnv('SANITY_E2E_DATASET'))

const studioE2EClient = createE2EClient(readEnv('SANITY_E2E_DATASET'))

async function main(): Promise<void> {
  const datasets = await withRateLimitRetry('Listing datasets', () =>
    studioE2EClient.datasets.list(),
  )

  // If the dataset doesn't exist, create it
  if (!datasets.find((ds) => ds.name === dataset)) {
    const timer = startTimer(`Creating dataset ${dataset}`)
    await withRateLimitRetry(`Creating dataset ${dataset}`, () =>
      studioE2EClient.datasets.create(dataset, {aclMode: 'public'}),
    )
    timer.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error)
  process.exitCode = 1
})
