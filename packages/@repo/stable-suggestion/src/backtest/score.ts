import semver from 'semver'

import {KNOWN_BAD_RANGE, NEW_MAJOR_SOAK_DAYS, SOAK_DAYS, URGENT_SOAK_DAYS} from '../config'
import {DAY_MS} from '../time'
import {
  type Evidence,
  type History,
  type IsoDate,
  type RegressionRecord,
  type StablePromotion,
} from '../types'

const P3_VERSION = '6.11.0'
const P3_CUTOFF = '2026-09-01T15:24:00Z'

type ExposureClass = 'none' | 'unknowable' | 'knowable'
type IndependentReason =
  | 'no-evidence'
  | 'unknown-version'
  | 'not-newer-than-stable'
  | 'too-new'
  | 'superseded'
  | 'deprecated'
  | 'regression'
  | 'regression-data-unavailable'
  | 'missing-packages'
  | 'rolled-back'
  | 'stable-mismatch'
  | 'package-set-mismatch'

export interface BacktestInput {
  asOf: IsoDate
  currentStable: string
  eligibleCount: number
  shortlist: string[]
  modelPick?: string | null
  leakageOk: boolean
  notes: string[]
}

interface HumanPromotionMatch {
  version: string
  at: IsoDate
}

export interface BacktestRow extends BacktestInput {
  humanPromotion?: HumanPromotionMatch
  exposure: ExposureClass
  exposedVersions: string[]
}

interface P1Violation {
  asOf: IsoDate
  version: string
  reasons: IndependentReason[]
}

interface P4Exposure {
  asOf: IsoDate
  versions: string[]
  classification: ExposureClass
}

export interface BacktestScore {
  rows: BacktestRow[]
  p1: {pass: boolean; violations: P1Violation[]}
  p2: {pass: boolean; failingDates: IsoDate[]}
  p3: {pass: boolean; version: string; cutoff: IsoDate; violations: IsoDate[]}
  p4: {none: number; unknowable: number; knowable: number; exposures: P4Exposure[]}
  p5: {
    datesWithHumanPromotion: number
    onShortlist: number
    topPick: number
    modelPickMatches: number
    modelPickSamples: number
  }
}

function isPublishedBy(publishedAt: IsoDate, asOf: IsoDate): boolean {
  return Date.parse(publishedAt) <= Date.parse(asOf)
}

function regressionCovers(
  regression: RegressionRecord,
  version: string,
  evidence: Evidence,
): boolean {
  if (semver.lt(version, regression.introducedIn)) {
    return false
  }
  const fixedInPublished = regression.fixedIn
    ? evidence.published.find((entry) => entry.version === regression.fixedIn)
    : undefined
  const fixedForVersion =
    regression.fixedIn !== null &&
    fixedInPublished !== undefined &&
    isPublishedBy(fixedInPublished.publishedAt, evidence.asOf) &&
    semver.gte(version, regression.fixedIn)
  return !fixedForVersion
}

function knownCoveringRegressions(evidence: Evidence, version: string): RegressionRecord[] {
  if (evidence.regressions.status === 'unavailable') {
    return []
  }
  return evidence.regressions.data.confirmed.filter(
    (regression) =>
      isPublishedBy(regression.knownAt, evidence.asOf) &&
      regressionCovers(regression, version, evidence),
  )
}

function requiredSoakDays(evidence: Evidence, version: string): number {
  const stable = evidence.currentStable
  const urgentEligible = semver.major(version) === semver.major(stable)
  const patchOfStable =
    semver.major(version) === semver.major(stable) &&
    semver.minor(version) === semver.minor(stable) &&
    semver.gt(version, stable)
  const hittingStable = knownCoveringRegressions(evidence, stable)
  const fixesStable =
    hittingStable.length > 0 &&
    hittingStable.every(
      (regression) => regression.fixedIn !== null && semver.gte(version, regression.fixedIn),
    )
  if (urgentEligible && (patchOfStable || fixesStable)) return URGENT_SOAK_DAYS
  return semver.major(version) > semver.major(stable) ? NEW_MAJOR_SOAK_DAYS : SOAK_DAYS
}

function isRolledBack(evidence: Evidence, version: string, publishedAt: IsoDate): boolean {
  if (evidence.latestMoves === undefined || evidence.latestMoves.status !== 'ok') {
    return false
  }
  const moves = evidence.latestMoves.data.filter((move) => isPublishedBy(move.at, evidence.asOf))
  return moves.some((move) => {
    const sameMajor = semver.major(move.version) === semver.major(version)
    const restoredLater = moves.filter(
      (later) =>
        Date.parse(later.at) > Date.parse(move.at) &&
        semver.major(later.version) === semver.major(version) &&
        semver.gte(later.version, version),
    )
    return (
      sameMajor &&
      semver.gt(version, move.version) &&
      Date.parse(publishedAt) < Date.parse(move.at) &&
      restoredLater.length === 0
    )
  })
}

function isUnavailable(evidence: Evidence, version: string, publishedAt: IsoDate): boolean {
  const deprecated =
    evidence.deprecationKnown &&
    Boolean(evidence.versions.find((entry) => entry.version === version)?.deprecated)
  const aboveLatest = evidence.mode === 'live' && semver.gt(version, evidence.latest)
  return deprecated || aboveLatest || isRolledBack(evidence, version, publishedAt)
}

const NO_PROMOTION_VERSION = '0.0.0'

function deriveStable(history: History, evidence: Evidence): string {
  if (evidence.mode === 'live') {
    return history.liveDistTags.stable
  }
  if (history.stablePromotions.status !== 'ok') {
    return evidence.currentStable
  }
  const known = history.stablePromotions.data
    .filter((promotion) => isPublishedBy(promotion.at, evidence.asOf))
    .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
  return known.at(-1)?.version ?? NO_PROMOTION_VERSION
}

function derivePackageSet(history: History, evidence: Evidence): string[] {
  if (evidence.mode === 'live') {
    return history.repoPackageNames
  }
  const latest = history.sanityVersions
    .filter(
      (entry) =>
        semver.prerelease(entry.version) === null &&
        isPublishedBy(entry.publishedAt, evidence.asOf),
    )
    .map((entry) => entry.version)
    .sort(semver.rcompare)[0]
  return history.repoPackageNames.filter(
    (name) => latest !== undefined && history.packageVersions[name]?.includes(latest) === true,
  )
}

function differentNames(left: string[], right: string[]): boolean {
  return [...left].sort().join('\n') !== [...right].sort().join('\n')
}

function independentReasons(
  claimed: Evidence,
  version: string,
  history: History,
): IndependentReason[] {
  const derivedStable = deriveStable(history, claimed)
  const derivedNames = derivePackageSet(history, claimed)
  const evidence: Evidence = {
    ...claimed,
    currentStable: derivedStable,
    packageSet: {...claimed.packageSet, names: derivedNames},
  }
  const published = evidence.published.find((entry) => entry.version === version)
  if (published === undefined) {
    return ['unknown-version']
  }
  const asOfMs = Date.parse(evidence.asOf)
  const facts = evidence.versions.find((entry) => entry.version === version)
  const presentIn = (name: string) => history.packageVersions[name]?.includes(version) === true
  const supersededBy = evidence.published.filter(
    (entry) =>
      semver.prerelease(entry.version) === null &&
      semver.major(entry.version) === semver.major(version) &&
      semver.minor(entry.version) === semver.minor(version) &&
      semver.gt(entry.version, version) &&
      isPublishedBy(entry.publishedAt, evidence.asOf) &&
      !isUnavailable(evidence, entry.version, entry.publishedAt),
  )
  const checks: [IndependentReason, boolean][] = [
    ['not-newer-than-stable', semver.lte(version, evidence.currentStable)],
    [
      'too-new',
      asOfMs - Date.parse(published.publishedAt) < requiredSoakDays(evidence, version) * DAY_MS,
    ],
    ['superseded', supersededBy.length > 0],
    ['deprecated', evidence.deprecationKnown && Boolean(facts?.deprecated)],
    ['regression-data-unavailable', evidence.regressions.status === 'unavailable'],
    ['regression', knownCoveringRegressions(evidence, version).length > 0],
    [
      'missing-packages',
      history.sanityVersions.every((entry) => entry.version !== version) ||
        derivedNames.filter(presentIn).length !== derivedNames.length,
    ],
    ['stable-mismatch', derivedStable !== claimed.currentStable],
    ['package-set-mismatch', differentNames(derivedNames, claimed.packageSet.names)],
    [
      'rolled-back',
      isRolledBack(evidence, version, published.publishedAt) ||
        (evidence.mode === 'live' && semver.gt(version, evidence.latest)),
    ],
  ]
  return checks.filter(([, failed]) => failed).map(([reason]) => reason)
}

function checkShortlist(
  row: BacktestInput,
  evidence: Evidence | undefined,
  history: History,
): P1Violation[] {
  if (evidence === undefined) {
    return row.shortlist.map((version) => ({
      asOf: row.asOf,
      version,
      reasons: ['no-evidence' as const],
    }))
  }
  return row.shortlist
    .map((version) => ({
      asOf: row.asOf,
      version,
      reasons: independentReasons(evidence, version, history),
    }))
    .filter((violation) => violation.reasons.length > 0)
}

function isInKnownBadRange(version: string): boolean {
  return semver.gte(version, KNOWN_BAD_RANGE.from) && semver.lte(version, KNOWN_BAD_RANGE.to)
}

function classifyExposure(
  row: BacktestInput,
  evidence: Evidence | undefined,
): {exposure: ExposureClass; exposedVersions: string[]} {
  const exposedVersions = row.shortlist.filter(isInKnownBadRange)
  if (exposedVersions.length === 0) {
    return {exposure: 'none', exposedVersions}
  }
  const anyKnowable =
    evidence !== undefined &&
    exposedVersions.some((version) => knownCoveringRegressions(evidence, version).length > 0)
  return {exposure: anyKnowable ? 'knowable' : 'unknowable', exposedVersions}
}

function findHumanPromotion(
  asOf: IsoDate,
  promotions: StablePromotion[],
): HumanPromotionMatch | undefined {
  const windowStart = Date.parse(asOf)
  const windowEnd = windowStart + SOAK_DAYS * DAY_MS
  return promotions
    .filter((promotion) => {
      const at = Date.parse(promotion.at)
      return at >= windowStart && at < windowEnd
    })
    .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
    .map((promotion) => ({version: promotion.version, at: promotion.at}))[0]
}

function countRows(rows: BacktestRow[], exposure: ExposureClass): number {
  return rows.filter((row) => row.exposure === exposure).length
}

export function scoreBacktest(
  inputs: BacktestInput[],
  evidenceByDate: Record<IsoDate, Evidence>,
  history: History,
): BacktestScore {
  const humanPromotions: StablePromotion[] =
    history.stablePromotions.status === 'ok' ? history.stablePromotions.data : []
  const rows: BacktestRow[] = inputs.map((input) => ({
    ...input,
    humanPromotion: findHumanPromotion(input.asOf, humanPromotions),
    ...classifyExposure(input, evidenceByDate[input.asOf]),
  }))
  const violations = inputs.flatMap((input) =>
    checkShortlist(input, evidenceByDate[input.asOf], history),
  )
  const p3Violations = inputs
    .filter(
      (input) =>
        Date.parse(input.asOf) >= Date.parse(P3_CUTOFF) && input.shortlist.includes(P3_VERSION),
    )
    .map((input) => input.asOf)
  const failingDates = inputs.flatMap((input) => (input.leakageOk ? [] : [input.asOf]))
  const promotedRows = rows.filter((row) => row.humanPromotion !== undefined)
  const sampledRows = rows.filter((row) => row.modelPick !== undefined && row.humanPromotion)

  return {
    rows,
    p1: {pass: violations.length === 0, violations},
    p2: {pass: failingDates.length === 0, failingDates},
    p3: {
      pass: p3Violations.length === 0,
      version: P3_VERSION,
      cutoff: P3_CUTOFF,
      violations: p3Violations,
    },
    p4: {
      none: countRows(rows, 'none'),
      unknowable: countRows(rows, 'unknowable'),
      knowable: countRows(rows, 'knowable'),
      exposures: rows
        .filter((row) => row.exposure !== 'none')
        .map((row) => ({
          asOf: row.asOf,
          versions: row.exposedVersions,
          classification: row.exposure,
        })),
    },
    p5: {
      datesWithHumanPromotion: promotedRows.length,
      onShortlist: promotedRows.filter((row) =>
        row.shortlist.includes(row.humanPromotion?.version ?? ''),
      ).length,
      topPick: promotedRows.filter((row) => row.shortlist[0] === row.humanPromotion?.version)
        .length,
      modelPickSamples: sampledRows.length,
      modelPickMatches: sampledRows.filter((row) => row.modelPick === row.humanPromotion?.version)
        .length,
    },
  }
}
