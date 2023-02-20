import core from '@actions/core'
import {studioMetricsClient} from './config/studioMetricsClient'
import {getEnv} from './utils/env'

async function run() {
  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'deployment',
    sha: getEnv('COMMIT_SHA'),
    url: getEnv('BRANCH_DEPLOYMENT_URL'),
  })
}

run().catch((error) => {
  core.setFailed(error.message)
})
