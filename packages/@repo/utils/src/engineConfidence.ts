/**
 * The `engineConfidenceRun` document: one per ISO week, written by
 * `engine-confidence/` and read by dev/radar. This is the stored shape, so
 * every array item carries a `_key` and an unmeasured score is an explicit
 * `not-measured` object, never `null`. Ratios are fractions in [0, 1].
 * Browser-safe: no node imports.
 */

export const ENGINE_CONFIDENCE_RUN_TYPE = 'engineConfidenceRun'
export const ENGINE_CONFIDENCE_SCHEMA_VERSION = 1

export const STRYKER_TARGET_IDS = ['sanity', 'mutator'] as const
export type StrykerTargetId = (typeof STRYKER_TARGET_IDS)[number]

export const CATALOGUE_SUITE_IDS = ['unit:mutator', 'unit:engine', 'fuzz:pt', 'e2e'] as const
export type CatalogueSuiteId = (typeof CATALOGUE_SUITE_IDS)[number]

export type StrykerMutantStatus =
  | 'Killed'
  | 'Timeout'
  | 'Survived'
  | 'NoCoverage'
  | 'RuntimeError'
  | 'CompileError'
  | 'Ignored'
  | 'Pending'

/** What a mutant counts as once the reviewed exclusion register is applied to Stryker's status. */
export type CountedMutantStatus = StrykerMutantStatus | 'Excluded'

export interface MutantCounts {
  killed: number
  timeout: number
  survived: number
  noCoverage: number
  runtimeError: number
  compileError: number
  /** Skipped by the ignore rules (error messages, log calls) before any test ran. */
  ignored: number
  /** Survived or uncovered mutants a reviewer judged meaningless to test; see `exclusions.json`. */
  excluded: number
}

export interface NotMeasured {
  status: 'not-measured'
  reason: string
}

export interface MutatedFileResult {
  _key: string
  /** Repo-root-relative, e.g. `packages/@sanity/mutator/src/document/BufferedDocument.ts`. */
  path: string
  target: StrykerTargetId
  counts: MutantCounts
}

export interface StrykerTargetRun {
  _key: string
  target: StrykerTargetId
  mode: 'full' | 'incremental'
  /** Mutant results Stryker reused from the previous run's incremental file; 0 on a full run. */
  reusedMutants: number
  dryRunTests: number
  durationMs: number
}

export interface MeasuredScore {
  status: 'measured'
  /** Stryker's mutation score: (killed + timeout) / (killed + timeout + survived + no coverage). */
  ratio: number
  /** Leaves out mutants no test reaches; absent when every mutant is uncovered. */
  coveredRatio?: number
  counts: MutantCounts
  targets: StrykerTargetRun[]
  files: MutatedFileResult[]
}

/** The engine confidence score: the Stryker mutation score, nothing else. */
export type EngineConfidenceScore = MeasuredScore | NotMeasured

export type CatalogueSeverity = 'S1' | 'S2' | 'S3'

/** `engine-confidence/catalogue/<id>-<slug>.json`, the sidecar beside each patch. */
export interface CatalogueEntryMetadata {
  /** `ENG-001`. Never reused, even after the entry is retired. */
  id: string
  title: string
  severity: CatalogueSeverity
  failureClass: string
  source: string
  sourceUrl?: string
  filesTouched: string[]
  userVisibleEffect: string
  /** Suites that never execute the patched code; the runner skips them. */
  notApplicableSuites: CatalogueSuiteId[]
  /** What the entry's author expects to catch it, so a surprise shows in the run log. */
  expectedCaughtBy: CatalogueSuiteId[]
  /** `YYYY-MM-DD`. */
  addedOn: string
  retiredOn?: string
  retiredReason?: string
}

export type CatalogueSuiteStatus = 'caught' | 'missed' | 'not-applicable' | 'not-run'

export interface CatalogueSuiteResult {
  _key: string
  suite: CatalogueSuiteId
  status: CatalogueSuiteStatus
  /** Tests that passed on the clean tree and failed with the patch, re-confirmed on the clean tree. */
  failingTests?: string[]
  durationMs?: number
}

export interface CatalogueEntryResult {
  _key: string
  id: string
  title: string
  severity: CatalogueSeverity
  failureClass: string
  sourceUrl?: string
  addedOn: string
  results: CatalogueSuiteResult[]
}

export interface MeasuredKnownBugs {
  status: 'measured'
  activeEntries: number
  caughtEntries: number
  entries: CatalogueEntryResult[]
}

/** Supporting detail only: the known-bug catalogue never feeds the score. */
export type KnownBugsSummary = MeasuredKnownBugs | NotMeasured

export interface EngineConfidenceConfig {
  /** Bumped on any pinned-config change; Radar draws a series break. */
  version: number
  /** sha256 of the pinned config files, so an unbumped change fails the run. */
  hash: string
  strykerVersion: string
  vitestVersion: string
  timeoutMs: number
  concurrency: number
  fuzzSeeds: number[]
  fuzzRuns: number
}

export interface EngineConfidenceRunDocument {
  _id: string
  _type: typeof ENGINE_CONFIDENCE_RUN_TYPE
  schemaVersion: typeof ENGINE_CONFIDENCE_SCHEMA_VERSION
  /** `2026-W42`, in UTC, of `startedAt`. Also the `_id` suffix. */
  isoWeek: string
  trigger: 'schedule' | 'dispatch' | 'local'
  startedAt: string
  completedAt: string
  git: {
    sha: string
    branch: string
    committedAt?: string
    /** Weak: the `gitCommit` document may not be synced yet. */
    commit?: {_type: 'reference'; _ref: string; _weak: true}
  }
  runner: {
    os: string
    arch: string
    cpus: number
    memGb: number
    nodeVersion: string
    cpuModel?: string
    imageOs?: string
    imageVersion?: string
    ci: boolean
    runId?: string
    runAttempt?: number
  }
  config: EngineConfidenceConfig
  score: EngineConfidenceScore
  knownBugs: KnownBugsSummary
}

export function emptyMutantCounts(): MutantCounts {
  return {
    killed: 0,
    timeout: 0,
    survived: 0,
    noCoverage: 0,
    runtimeError: 0,
    compileError: 0,
    ignored: 0,
    excluded: 0,
  }
}

export function countMutantStatuses(statuses: readonly CountedMutantStatus[]): MutantCounts {
  if (statuses.includes('Pending')) {
    throw new Error('Mutant still pending in a finished Stryker report')
  }
  const countOf = (status: CountedMutantStatus) =>
    statuses.filter((candidate) => candidate === status).length
  return {
    killed: countOf('Killed'),
    timeout: countOf('Timeout'),
    survived: countOf('Survived'),
    noCoverage: countOf('NoCoverage'),
    runtimeError: countOf('RuntimeError'),
    compileError: countOf('CompileError'),
    ignored: countOf('Ignored'),
    excluded: countOf('Excluded'),
  }
}

export function addMutantCounts(left: MutantCounts, right: MutantCounts): MutantCounts {
  return {
    killed: left.killed + right.killed,
    timeout: left.timeout + right.timeout,
    survived: left.survived + right.survived,
    noCoverage: left.noCoverage + right.noCoverage,
    runtimeError: left.runtimeError + right.runtimeError,
    compileError: left.compileError + right.compileError,
    ignored: left.ignored + right.ignored,
    excluded: left.excluded + right.excluded,
  }
}

/** Mutants a test failed on: what Stryker calls detected. */
export function detectedMutants(counts: MutantCounts): number {
  return counts.killed + counts.timeout
}

/** Survived plus never reached by a test: the planted bugs nothing caught. */
export function missedMutants(counts: MutantCounts): number {
  return counts.survived + counts.noCoverage
}

/** Stryker's mutation score: errors, ignored and excluded mutants are not in the denominator. */
export function mutationScoreOf(counts: MutantCounts): number | undefined {
  const scored = detectedMutants(counts) + missedMutants(counts)
  return scored === 0 ? undefined : detectedMutants(counts) / scored
}

export function coveredMutationScoreOf(counts: MutantCounts): number | undefined {
  const covered = detectedMutants(counts) + counts.survived
  return covered === 0 ? undefined : detectedMutants(counts) / covered
}

export function isEntryCaught(entry: Pick<CatalogueEntryResult, 'results'>): boolean {
  return entry.results.some((result) => result.status === 'caught')
}

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_WEEK_PATTERN = /^(\d{4})-W(\d{2})$/

/** `2026-W42` for any instant in that ISO week, in UTC. */
export function isoWeekOf(date: Date): string {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  // The ISO year is the year holding the week's Thursday
  const thursday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday + 3),
  )
  const isoYear = thursday.getUTCFullYear()
  const week = Math.floor((thursday.getTime() - Date.UTC(isoYear, 0, 1)) / (7 * DAY_MS)) + 1
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

/** Monday 00:00 UTC of an ISO week, matching dev/radar's weekly buckets. */
export function isoWeekStart(isoWeek: string): Date {
  const match = ISO_WEEK_PATTERN.exec(isoWeek)
  if (match === null) {
    throw new Error(`Expected an ISO week like 2026-W42, got "${isoWeek}"`)
  }
  const [, year, week] = match
  const januaryFourth = new Date(Date.UTC(Number(year), 0, 4))
  const firstMonday = januaryFourth.getTime() - ((januaryFourth.getUTCDay() + 6) % 7) * DAY_MS
  return new Date(firstMonday + (Number(week) - 1) * 7 * DAY_MS)
}
