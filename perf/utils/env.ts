export function getEnv(name: string) {
  const envVar = process.env.PERF_TEST_SANITY_TOKEN
  if (!envVar) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return envVar
}
