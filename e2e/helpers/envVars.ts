type KnownEnvVar =
  | 'SANITY_E2E_SESSION_TOKEN'
  | 'SANITY_E2E_PROJECT_ID'
  | 'SANITY_E2E_DATASET'
  | 'SANITY_E2E_DATASET_CHROMIUM'
  | 'SANITY_E2E_DATASET_FIREFOX'
  | 'SANITY_E2E_BASE_URL'
  | 'SANITY_E2E_DEBUG'
  | 'CI'
  | 'HEADLESS'

/**
 * Read an environment variable, parsing the response as a boolean, using loose
 * constraints (`true`, `1`, `yes` are all considered true, everything else is false)
 *
 * @param flag - The environment variable to read, eg `SOME_FLAG`
 * @param defaultValue - The default value to use if it is not set
 * @returns A boolean value
 * @internal
 */
export function readBoolEnv(flag: KnownEnvVar, defaultValue: boolean): boolean {
  const value = findEnv(flag)
  if (value === undefined) {
    return defaultValue
  }

  return value === 'true' || value === '1' || value === 'yes'
}

export function readEnv(name: KnownEnvVar): string {
  const val = findEnv(name)
  if (val === undefined) {
    throw new Error(
      `Missing required environment variable "${name}". Make sure to copy \`.env.example\` to \`.env.local\``,
    )
  }
  return val
}

export function findEnv(name: KnownEnvVar): string | undefined {
  return process.env[name]
}
