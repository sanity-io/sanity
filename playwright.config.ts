import {defineConfig} from '@playwright/test'
import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {createPlaywrightConfig} from '@sanity/test'

loadEnvFiles()

/**
 * Read an environment variable, parsing the response as a boolean, using loose
 * constraints (`true`, `1`, `yes` are all considered true, everything else is false)
 *
 * @param flag - The environment variable to read, eg `SOME_FLAG`
 * @param defaultValue - The default value to use if it is not set
 * @returns A boolean value
 * @internal
 */
function readBoolEnv(flag: string, defaultValue: boolean) {
  const value = process.env[flag]
  if (value === undefined) {
    return defaultValue
  }

  return value === 'true' || value === '1' || value === 'yes'
}

const CI = readBoolEnv('CI', false)

const playwrightConfig = createPlaywrightConfig({
  projectId: process.env.SANITY_E2E_PROJECT_ID!,
  token: process.env.SANITY_E2E_SESSION_TOKEN!,
  playwrightOptions(config) {
    return {
      ...config,
      use: {
        ...config.use,
        baseURL: 'http://localhost:3339',
      },
      webServer: {
        ...config.webServer,
        command: CI ? 'yarn e2e:start' : 'yarn e2e:dev',
        port: 3339,
      },
    }
  },
})

export default defineConfig(playwrightConfig)
