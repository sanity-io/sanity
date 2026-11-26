export type IsoDate = string
export type Sourced<Data> = {status: 'ok'; data: Data} | {status: 'unavailable'; error: string}

export interface VersionFacts {
  version: string
  publishedAt: IsoDate
  deprecated: string | null
  packagesWithVersion: string[]
}
export interface RegressionRecord {
  id: string
  introducedIn: string
  fixedIn: string | null
  severity: 'minor' | 'major' | 'critical' | null
  knownAt: IsoDate
  label: string
}
export interface Investigation {
  id: string
  goodVersion: string
  badVersion: string
  knownAt: IsoDate
  resolvedAt?: IsoDate | null
}
export interface SqrlFacts {
  version: string
  score: number
  scoreCommit: number
  formulaVersion: number
  regressedInputs: string[]
  reliabilityEvents: number
  createdAt: IsoDate
}
export interface IssueReport {
  number: number
  title: string
  url: string
  createdAt: IsoDate
  closedAt: IsoDate | null
  labels: string[]
  versionsMentioned: string[]
}
export interface OpenIssueInRange {
  number: number
  title: string
  url: string
  versions: string[]
  createdAt: IsoDate
}
export interface ReleaseBench {
  version: string
  calibrationMs: number | null
  initialJsBytes: number | null
  totalJsBytes: number | null
  createdAt: IsoDate
}
export interface StablePromotion {
  version: string
  at: IsoDate
}

export interface LatestMove {
  version: string
  at: IsoDate
}
export type StableByPackage = Record<string, string | null>

export interface History {
  fetchedAt: IsoDate
  sanityVersions: {version: string; publishedAt: IsoDate; deprecated: string | null}[]
  packageVersions: Record<string, string[]>
  repoPackageNames: string[]
  liveDistTags: {latest: string; stable: string}
  liveDownloads: Sourced<Record<string, number>>
  stablePromotions: Sourced<StablePromotion[]>
  latestMoves?: Sourced<LatestMove[]>
  stableByPackage?: Sourced<StableByPackage>
  regressions: Sourced<{confirmed: RegressionRecord[]; investigations: Investigation[]}>
  sqrl: Sourced<SqrlFacts[]>
  releaseBench: Sourced<ReleaseBench[]>
  issues: Sourced<IssueReport[]>
}

export interface Evidence {
  schemaVersion: 1
  mode: 'live' | 'as-of'
  asOf: IsoDate
  currentStable: string
  currentStableSince: IsoDate | null
  latest: string
  deprecationKnown: boolean
  published: {version: string; publishedAt: IsoDate}[]
  versions: VersionFacts[]
  packageSet: {names: string[]; source: 'repo' | 'as-of-inferred'}
  regressions: History['regressions']
  sqrl: History['sqrl']
  issues: History['issues']
  downloads: Sourced<Record<string, number>> | {status: 'not-applicable'}
  releaseBench: History['releaseBench']
  latestMoves?: Sourced<LatestMove[]>
  stableByPackage?: Sourced<StableByPackage> | {status: 'not-applicable'}
}

export type HardReasonCode =
  | 'too-new'
  | 'superseded'
  | 'deprecated'
  | 'regression'
  | 'missing-packages'
  | 'regression-data-unavailable'
  | 'rolled-back'
export type SoftFlagCode =
  | 'is-patch'
  | 'major-upgrade'
  | 'sqrl-drop'
  | 'sqrl-regressed-inputs'
  | 'sqrl-reliability'
  | 'sqrl-missing'
  | 'open-issue-reports'
  | 'open-investigation'
  | 'adoption-below-stable'
export interface Verdict<Code extends string> {
  code: Code
  detail: string
}

export type UrgentReason = 'stable-patch' | 'stable-at-risk-fix'

export interface Candidate {
  version: string
  publishedAt: IsoDate
  ageDays: number
  eligible: boolean
  eligibleFrom: IsoDate
  hard: Verdict<HardReasonCode>[]
  soft: Verdict<SoftFlagCode>[]
  adoptionShare: number | null
  sqrl: SqrlFacts | null
  sqrlBaseline: number | null
  openIssueNumbers: number[]
  urgentReason?: UrgentReason | null
}
export interface StableSplit {
  sanityStable: string | null
  byPackage: StableByPackage
}
export interface Evaluation {
  asOf: IsoDate
  mode: Evidence['mode']
  currentStable: string
  currentStableSince: IsoDate | null
  latest: string
  candidates: Candidate[]
  eligible: string[]
  shortlist: string[]
  stableAtRisk: Verdict<'regression'>[]
  stableSplit?: StableSplit | null
  openIssuesInRange: OpenIssueInRange[]
}

export type ModelFailureReason =
  | 'disabled'
  | 'no-api-key'
  | 'api-error'
  | 'refusal'
  | 'truncated'
  | 'invalid-json'
  | 'outside-eligible-set'
  | 'empty-shortlist'
  | 'no-eligible-versions'
export interface ShortlistEntry {
  version: string
  reason: string
}
export interface Recommendation {
  schemaVersion: 1
  evaluation: Evaluation
  decision: 'promote' | 'hold'
  shortlist: ShortlistEntry[]
  source: 'model' | 'deterministic'
  fallbackReason: ModelFailureReason | null
  model: string | null
  headline: string
  rationale: string
  concerns: {version: string; note: string}[]
  confidence: 'low' | 'medium' | 'high' | null
}

export type SlackRoute = 'webhook-trigger' | 'incoming-webhook' | 'none'
export interface ShortlistMessage {
  headline: string
  text: string
  cli: string | null
}
export interface WebhookPayload {
  headline: string
  text: string
  cli: string
  run_url: string
}
export interface FallbackPayload {
  text: string
}
