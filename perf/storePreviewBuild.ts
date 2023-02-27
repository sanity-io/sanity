import core from '@actions/core'
import {studioMetricsClient} from './config/studioMetricsClient'
import {readEnv} from './config/envVars'

async function run() {
  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'deployment',
    sha: readEnv('COMMIT_SHA'),
    url: readEnv('BRANCH_DEPLOYMENT_URL'),
  })
}

run().catch((error) => {
  core.setFailed(error.message)
})
