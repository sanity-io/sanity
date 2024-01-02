import {defineConfig} from '@playwright/test'
import {createPlaywrightConfig} from '@sanity/test'
import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {readBoolEnv, readEnv} from './test/e2e/helpers/envVars'

loadEnvFiles()

const CI = readBoolEnv('CI', false)

const playwrightConfig = createPlaywrightConfig({
  projectId: readEnv('SANITY_E2E_PROJECT_ID'),
  token: readEnv('SANITY_E2E_SESSION_TOKEN'),
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
