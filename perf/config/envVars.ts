type KnownEnvVar =
  | 'PERF_TEST_HEADLESS'
  | 'PERF_TEST_BRANCH'
  | 'PERF_TEST_METRICS_TOKEN'
  | 'PERF_TEST_SANITY_TOKEN'
  | 'COMMIT_SHA'
  | 'BRANCH_DEPLOYMENT_URL'

export function readEnv(name: KnownEnvVar): string {
  const val = findEnv(name)
  if (val === undefined) {
    throw new Error(`Missing required environment variable "${name}"`)
  }
  return val
}

export function findEnv(name: KnownEnvVar): string | undefined {
  return process.env[name]
}
