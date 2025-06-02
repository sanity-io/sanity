import {loadEnvFiles} from '../../scripts/utils/loadEnvFiles'

loadEnvFiles()

type KnownEnvVar = 'SANITY_E2E_PROJECT_ID' | 'SANITY_E2E_DATASET' | 'SANITY_E2E_SESSION_TOKEN'

export function readEnv(name: KnownEnvVar): string {
  const val = process.env[name]
  if (val === undefined) {
    throw new Error(
      `Missing required environment variable "${name}" 'See \`test/e2e/README.md\` for details.'`,
    )
  }
  return val
}
