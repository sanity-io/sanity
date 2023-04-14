/* eslint-disable no-process-env */
/* eslint-disable no-process-exit */

import {loadEnvFiles} from '../../scripts/utils/loadEnvFiles'

loadEnvFiles()

const SANITY_E2E_SESSION_TOKEN = process.env.SANITY_E2E_SESSION_TOKEN!

if (!SANITY_E2E_SESSION_TOKEN) {
  console.error('Missing `SANITY_E2E_SESSION_TOKEN` environment variable.')
  console.error('See `test/e2e/README.md` for details.')
  process.exit(1)
}

export {SANITY_E2E_SESSION_TOKEN}
