import {parseArgs} from 'node:util'
import globby from 'globby'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {run} from './runner/runner'
import {findEnv, readEnv} from './config/envVars'
import * as queries from './queries'
import {getCurrentBranchSync} from './runner/utils/gitUtils'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './config/constants'

config({path: `${__dirname}/.env`})

async function main(args: {branch?: string; headless?: boolean}) {
  const testFiles = await globby(`${__dirname}/tests/**/*.test.ts`)
  const branch = args.branch || findEnv('PERF_TEST_BRANCH') || getCurrentBranchSync()
  const headless = args.headless ?? findEnv('PERF_TEST_HEADLESS') !== 'false'

  const studioMetricsClient = createClient({
    projectId: 'c1zuxvqn',
    dataset: 'production',
    token: readEnv('PERF_TEST_METRICS_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })

  const deployments = await studioMetricsClient.fetch(queries.currentBranch, {
    branch,
    headless,
  })

  if (deployments.length === 0) {
    console.error('No deployments found for branch %s', branch)
    process.exit(0)
  }
  // eslint-disable-next-line no-console
  console.log(`Running tests on the ${deployments.length} most recent deployments`)

  if (deployments.length === 1) {
    console.error(
      'Only a single deployment found for current branch (%s). Two or more deployments are required in order to run the performance tests',
      branch
    )
    process.exit(0)
  }

  const perfStudioClient = createClient({
    projectId: STUDIO_PROJECT_ID,
    dataset: STUDIO_DATASET,
    token: readEnv('PERF_TEST_SANITY_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })

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

const {values: args} = parseArgs({
  args: process.argv.slice(2),
  options: {
    branch: {
      type: 'string',
      short: 'b',
    },
    headless: {
      type: 'boolean',
      short: 'h',
    },
  },
})

main(args).then(
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
