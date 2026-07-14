/**
 * Fixed ports, project ids and environment presets shared by the studio
 * config, the mock API server, and the runner. Everything is constant by
 * design — the suite is hermetic, so nothing here is secret or
 * environment-dependent (see README).
 */

export interface BenchSide {
  /** Which A/B side this configuration belongs to. */
  side: 'experiment' | 'reference'
  /** Fake Sanity project id — becomes the `<projectId>.localhost` host. */
  projectId: string
  /** Port the mock API server listens on. */
  apiPort: number
  /** Port the static studio build is served on. */
  studioPort: number
}

export const EXPERIMENT: BenchSide = {
  side: 'experiment',
  projectId: 'benchexp',
  apiPort: 4311,
  studioPort: 3411,
}

export const REFERENCE: BenchSide = {
  side: 'reference',
  projectId: 'benchref',
  apiPort: 4312,
  studioPort: 3412,
}

export const DATASET = 'bench'

/** The dummy studio auth token seeded into localStorage (never a secret). */
export const FAKE_TOKEN = 'bench-fake-token'

/** The mock user returned by /users/me. */
export const BENCH_USER = {
  id: 'bench-user',
  name: 'Bench User',
  email: 'bench@sanity.io',
  profileImage: '',
  provider: 'google',
  role: 'administrator',
  roles: [{name: 'administrator', title: 'Administrator'}],
} as const

/** CPU throttling factor applied to interaction and pageLoad sessions. */
export const CPU_THROTTLE_RATE = 4
