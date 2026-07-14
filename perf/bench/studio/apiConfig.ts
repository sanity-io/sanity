import {DATASET, EXPERIMENT} from '../constants'

/**
 * Baked into the studio bundle at build time. The runner builds each side
 * with its own values (reference gets `benchref` + its own mock port); plain
 * `sanity dev`/`sanity build` without env falls back to the experiment side
 * pointed at a locally running mock (`pnpm bench:dev`).
 */
export const apiConfig = {
  projectId: process.env.SANITY_STUDIO_BENCH_PROJECT_ID || EXPERIMENT.projectId,
  dataset: process.env.SANITY_STUDIO_BENCH_DATASET || DATASET,
  // https + HTTP/2 always: over plain h1 the browser's 6-connections-per-host
  // limit starves the studio's concurrent SSE listeners (see mock-api/tls.ts)
  apiHost: process.env.SANITY_STUDIO_BENCH_API_HOST || `https://localhost:${EXPERIMENT.apiPort}`,
}
