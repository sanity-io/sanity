import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {createPlaywrightConfig} from '@sanity/test'

import {loadEnvFiles} from './scripts/utils/loadEnvFiles'
import {readBoolEnv, readEnv} from './test/e2e/helpers/envVars'

loadEnvFiles()

const CI = readBoolEnv('CI', false)

/**
 * Excludes the GitHub reporter until https://github.com/microsoft/playwright/issues/19817 is resolved, since it creates a lot of noise in our PRs.
 * @param reporters - The reporters config to exclude the github reporter from
 */
function excludeGithub(reporters: PlaywrightTestConfig['reporter']) {
  if (Array.isArray(reporters)) {
    return reporters.filter((reporterDescription) => reporterDescription[0] !== 'github')
  }
  return reporters === 'github' ? undefined : reporters
}

const playwrightConfig = createPlaywrightConfig({
  projectId: readEnv('SANITY_E2E_PROJECT_ID'),
  token: readEnv('SANITY_E2E_SESSION_TOKEN'),
  playwrightOptions(config) {
    return {
      ...config,
      reporter: excludeGithub(config.reporter),
      use: {
        ...config.use,
        baseURL: 'http://localhost:3339',
      },
      webServer: {
        ...config.webServer,
        command: CI ? 'pnpm e2e:start' : 'pnpm e2e:dev',
        port: 3339,
      },
    }
  },
})

export default defineConfig(playwrightConfig)
