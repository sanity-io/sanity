export function fail(name: string): never {
  throw new Error(`Missing required environment variable "${name}"`)
}
export const apiConfig = {
  projectId:
    process.env.SANITY_STUDIO_EFPS_EXPERIMENT_PROJECT_ID ||
    fail('SANITY_STUDIO_EFPS_EXPERIMENT_PROJECT_ID'),
  dataset:
    process.env.SANITY_STUDIO_EFPS_EXPERIMENT_DATASET ||
    fail('SANITY_STUDIO_EFPS_EXPERIMENT_DATASET'),
  apiHost:
    process.env.SANITY_STUDIO_EFPS_EXPERIMENT_API_HOST ||
    fail('SANITY_STUDIO_EFPS_EXPERIMENT_API_HOST'),
}
