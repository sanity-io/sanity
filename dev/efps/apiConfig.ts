export function fail(name: string): never {
  throw new Error(`Missing required environment variable "${name}"`)
}
export const apiConfig = {
  projectId:
    process.env.SANITY_STUDIO_PERF_EFPS_PROJECT_ID || fail('SANITY_STUDIO_PERF_EFPS_PROJECT_ID'),
  dataset: process.env.SANITY_STUDIO_PERF_EFPS_DATASET || fail('SANITY_STUDIO_PERF_EFPS_DATASET'),
  apiHost: process.env.SANITY_STUDIO_PERF_EFPS_API_HOST || fail('SANITY_STUDIO_PERF_EFPS_API_HOST'),
}
