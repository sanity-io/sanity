import {readEnvVar} from './readEnvVar'

export const apiConfig = {
  projectId: readEnvVar('SANITY_STUDIO_PERF_EFPS_PROJECT_ID'),
  dataset: readEnvVar('SANITY_STUDIO_PERF_EFPS_DATASET'),
  apiHost: readEnvVar('SANITY_STUDIO_PERF_EFPS_API_HOST'),
} as const
