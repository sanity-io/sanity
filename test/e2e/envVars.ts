import {loadEnvFiles} from '@repo/utils'

loadEnvFiles()

export type KnownEnvVar =
  | 'SANITY_E2E_DATASET'
  | 'SANITY_E2E_PROJECT_ID'
  | 'PR_NUMBER'
  | 'SANITY_E2E_SESSION_TOKEN'

export function readEnv(name: KnownEnvVar): string {
  const val = process.env[name]
  if (val === undefined) {
    throw new Error(
      `Missing required environment variable "${name}" 'See \`test/e2e/README.md\` for details.'`,
    )
  }
  return val
}
