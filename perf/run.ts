import globby from 'globby'
import {run} from './runner/runner'
import {studioMetricsClient} from './config/studioMetricsClient'
import {perfStudioClient} from './config/perfStudioClient'
import {findEnv, readEnv} from './config/envVars'

const headless = findEnv('PERF_TEST_HEADLESS') !== 'false'

async function main() {
  const testFiles = await globby(`${__dirname}/tests/**/*.test.ts`)
  return run({
    testFiles,
    perfStudioClient,
    studioMetricsClient,
    registerHelpersFile: require.resolve(`${__dirname}/tests/helpers/register.ts`),
    headless,
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
