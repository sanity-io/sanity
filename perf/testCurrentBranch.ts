import globby from 'globby'
import {run} from './runner/runner'
import {studioMetricsClient} from './config/studioMetricsClient'
import {perfStudioClient} from './config/perfStudioClient'
import {findEnv, readEnv} from './config/envVars'
import * as queries from './queries'
import {getCurrentBranchSync} from './runner/utils/gitUtils'

const headless = findEnv('PERF_TEST_HEADLESS') !== 'false'

async function main() {
  const testFiles = await globby(`${__dirname}/tests/**/*.test.ts`)
  const currentBranch = findEnv('PERF_TEST_BRANCH') || getCurrentBranchSync()
  const deployments = await studioMetricsClient.fetch(queries.currentBranch, {
    branch: currentBranch,
  })

  if (deployments.length === 0) {
    console.error('No deployments found for branch %s', currentBranch)
    process.exit(0)
  }
  // eslint-disable-next-line no-console
  console.log(`Running tests on the ${deployments.length} most recent deployments`)

  if (deployments.length === 1) {
    console.error(
      'Only a single deployment found for current branch (%s). Two or more deployments are required in order to run the performance tests',
      currentBranch
    )
    process.exit(0)
  }

  return run({
    testFiles,
    deployments,
    perfStudioClient,
    studioMetricsClient,
    registerHelpersFile: require.resolve(`${__dirname}/tests/helpers/register.ts`),
    headless,
    iterations: 1,
    token: readEnv('PERF_TEST_SANITY_TOKEN'),
  })
}

main().then(
  () => {
    // eslint-disable-next-line no-console
    console.log('Ran performance test suite')
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
)
