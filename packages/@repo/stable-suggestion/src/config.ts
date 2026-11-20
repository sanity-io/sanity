export const SOAK_DAYS = 7
export const NEW_MAJOR_SOAK_DAYS = 3
export const URGENT_SOAK_DAYS = 1
export const SHORTLIST_SIZE = 3
export const DEFAULT_MODEL = 'claude-opus-5-5'
export const MODEL_ENV_VAR = 'STABLE_SUGGESTION_MODEL'
export const MODEL_EFFORT = 'medium'
export const SQRL_DROP_RATIO = 0.9
export const SQRL_BASELINE_RELEASES = 4
export const RADAR = {projectId: 'mhfozd0z', dataset: 'bench', apiVersion: '2025-02-19'} as const
export const PACKAGE_NAME = 'sanity'
export const BACKTEST_FROM = '2025-12-09'
export const BACKTEST_TIME_OF_DAY_UTC = '18:00:00Z'
export const KNOWN_BAD_RANGE = {from: '6.9.2', to: '6.14.0'} as const
export const TEXT_LIMITS = {
  headline: 200,
  rationale: 1500,
  reason: 300,
  note: 300,
} as const

export function getModel(): string {
  return process.env[MODEL_ENV_VAR] || DEFAULT_MODEL
}
