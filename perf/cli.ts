import {parseArgs} from 'node:util'
import globby from 'globby'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {run} from './runner/runner'
import {findEnv, readEnv} from './config/envVars'
import * as queries from './queries'
import {getCurrentBranchSync, getGitInfoSync} from './runner/utils/gitUtils'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './config/constants'
import {Deployment} from './runner/types'
import {sanityIdify} from './runner/utils/sanityIdIfy'

config({path: `${__dirname}/.env`})

async function main(args: {
  branch?: string
  headless?: boolean
  pattern?: string
  local?: boolean
  count?: string
  label?: string
}) {
  const currentBranch = getCurrentBranchSync()
  const testFiles = await globby(`${__dirname}/tests/**/${args.pattern || '*'}.test.ts`)
  const branch = args.branch || findEnv('PERF_TEST_BRANCH') || currentBranch
  const headless = args.headless ?? findEnv('PERF_TEST_HEADLESS') !== 'false'

  const studioMetricsClient = createClient({
    projectId: 'c1zuxvqn',
    dataset: 'production',
    token: readEnv('PERF_TEST_METRICS_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })

  const remoteDeployments = await studioMetricsClient.fetch(queries.branchDeploymentsQuery, {
    branch,
    headless,
    count: Number(args.count),
  })
  let localDeployment

  if (remoteDeployments.length === 0) {
    console.error('No deployments found for branch %s', branch)
    process.exit(0)
  }

  if (args.local) {
    const branchDocId = `branch-${sanityIdify(currentBranch)}`
    const head = getGitInfoSync(['commit']).commit
    localDeployment = await studioMetricsClient.createOrReplace({
      _id: `local-${sanityIdify(currentBranch)}-${head}`,
      _type: 'deployment',
      url: 'http://localhost:3300',
      deploymentId: 'local',
      branch: {
        _type: 'reference',
        _ref: branchDocId,
        _weak: true,
      },
      name: 'performance-studio',
      status: 'succeeded',
      label:
        args.label ?? `Local Perf Studio in ${currentBranch}@${getGitInfoSync(['commit']).commit}`,
    })
  }
  const deployments: Deployment[] = localDeployment
    ? [...remoteDeployments, localDeployment]
    : remoteDeployments

  if (deployments.length === 1) {
    console.error(
      'Two or more deployments are required in order to run the performance tests',
      branch
    )
    process.exit(0)
  }

  // eslint-disable-next-line no-console
  console.log(
    `Running tests on the ${remoteDeployments.length} most recent deployments${
      localDeployment ? ` (including local deployment at ${localDeployment.url})` : ''
    }`
  )

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
    local: {
      type: 'boolean',
      short: 'l',
    },
    label: {
      type: 'string',
    },
    pattern: {
      type: 'string',
      short: 'p',
    },
    count: {
      type: 'string',
      short: 'c',
      default: '4',
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
