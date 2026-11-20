import semver from 'semver'

import {
  NEW_MAJOR_SOAK_DAYS,
  PACKAGE_NAME,
  SHORTLIST_SIZE,
  SOAK_DAYS,
  SQRL_BASELINE_RELEASES,
  SQRL_DROP_RATIO,
  URGENT_SOAK_DAYS,
} from './config'
import {isStableRelease} from './sources/npm'
import {DAY_MS} from './time'
import {
  type Candidate,
  type Evaluation,
  type Evidence,
  type HardReasonCode,
  type Investigation,
  type IssueReport,
  type IsoDate,
  type LatestMove,
  type RegressionRecord,
  type SoftFlagCode,
  type SqrlFacts,
  type StableSplit,
  type UrgentReason,
  type Verdict,
} from './types'

const MIN_SQRL_BASELINE_POINTS = 2
const FEATURE_LABEL = 'Feature'

type Published = Evidence['published'][number]

function toTime(date: IsoDate): number {
  return Date.parse(date)
}

function publishedAtOf(published: Published[], version: string): number | null {
  const match = published.find((entry) => entry.version === version)
  return match ? toTime(match.publishedAt) : null
}

function isPublishedBy(published: Published[], version: string, asOf: number): boolean {
  const publishedAt = publishedAtOf(published, version)
  return publishedAt !== null && publishedAt <= asOf
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  const upper = sorted[middle] ?? 0
  return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? 0) + upper) / 2
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function describeRegression(regression: RegressionRecord): string {
  return `confirmed regression ${regression.label} (introduced in ${regression.introducedIn}, ${
    regression.fixedIn ? `fixed in ${regression.fixedIn}` : 'no fix published'
  })`
}

function isRegressionKnown(evidence: Evidence, regression: {knownAt: IsoDate}): boolean {
  return evidence.mode === 'live' || toTime(regression.knownAt) <= toTime(evidence.asOf)
}

function isStillBroken(evidence: Evidence, regression: RegressionRecord, version: string): boolean {
  const fixedIn = regression.fixedIn
  if (fixedIn === null) return true
  const fixPublished = isPublishedBy(evidence.published, fixedIn, toTime(evidence.asOf))
  return fixPublished ? semver.lt(version, fixedIn) : true
}

function blockingRegressions(evidence: Evidence, version: string): RegressionRecord[] {
  if (evidence.regressions.status === 'unavailable') return []
  return evidence.regressions.data.confirmed.filter(
    (regression) =>
      isRegressionKnown(evidence, regression) &&
      semver.lte(regression.introducedIn, version) &&
      isStillBroken(evidence, regression, version),
  )
}

function isPatchOfStable(evidence: Evidence, version: string): boolean {
  const stable = evidence.currentStable
  return (
    semver.major(version) === semver.major(stable) &&
    semver.minor(version) === semver.minor(stable) &&
    semver.gt(version, stable)
  )
}

function fixesBrokenStable(evidence: Evidence, version: string): boolean {
  const hitting = blockingRegressions(evidence, evidence.currentStable)
  return (
    hitting.length > 0 &&
    hitting.every(
      (regression) => regression.fixedIn !== null && semver.gte(version, regression.fixedIn),
    )
  )
}

function urgentReasonOf(evidence: Evidence, version: string): UrgentReason | null {
  if (semver.major(version) !== semver.major(evidence.currentStable)) return null
  if (isPatchOfStable(evidence, version)) return 'stable-patch'
  return fixesBrokenStable(evidence, version) ? 'stable-at-risk-fix' : null
}

function soakDaysFor(evidence: Evidence, version: string): number {
  if (urgentReasonOf(evidence, version) !== null) return URGENT_SOAK_DAYS
  return semver.major(version) > semver.major(evidence.currentStable)
    ? NEW_MAJOR_SOAK_DAYS
    : SOAK_DAYS
}

function rolledBackBy(evidence: Evidence, version: string, publishedAt: number): LatestMove | null {
  if (evidence.latestMoves?.status !== 'ok') return null
  const major = semver.major(version)
  const moves = evidence.latestMoves.data
    .filter((move) => toTime(move.at) <= toTime(evidence.asOf))
    .sort((left, right) => toTime(right.at) - toTime(left.at))
  const stillRolledBack = (move: LatestMove) =>
    moves.every(
      (later) =>
        toTime(later.at) <= toTime(move.at) ||
        semver.major(later.version) !== major ||
        semver.lt(later.version, version),
    )
  return (
    moves.find(
      (move) =>
        semver.major(move.version) === major &&
        semver.gt(version, move.version) &&
        publishedAt < toTime(move.at) &&
        stillRolledBack(move),
    ) ?? null
  )
}

function hardReasons(
  evidence: Evidence,
  version: string,
  publishedAt: number,
): Verdict<HardReasonCode>[] {
  const asOf = toTime(evidence.asOf)
  const verdicts: Verdict<HardReasonCode>[] = []

  const age = asOf - publishedAt
  const soakDays = soakDaysFor(evidence, version)
  if (age < soakDays * DAY_MS) {
    verdicts.push({
      code: 'too-new',
      detail: `published ${roundTo(age / DAY_MS, 1)} days ago, needs ${soakDays} days on latest (eligible from ${new Date(publishedAt + soakDays * DAY_MS).toISOString()})`,
    })
  }

  const newerPatch = evidence.published
    .filter(
      (entry) =>
        isStableRelease(entry.version) &&
        semver.major(entry.version) === semver.major(version) &&
        semver.minor(entry.version) === semver.minor(version) &&
        semver.gt(entry.version, version) &&
        toTime(entry.publishedAt) <= asOf,
    )
    .sort((left, right) => semver.rcompare(left.version, right.version))[0]
  if (newerPatch) {
    verdicts.push({
      code: 'superseded',
      detail: `${newerPatch.version} is a newer patch of ${semver.major(version)}.${semver.minor(version)}`,
    })
  }

  const facts = evidence.versions.find((entry) => entry.version === version)
  if (evidence.deprecationKnown && facts?.deprecated) {
    verdicts.push({code: 'deprecated', detail: `deprecated on npm: ${facts.deprecated}`})
  }

  if (evidence.regressions.status === 'unavailable') {
    verdicts.push({
      code: 'regression-data-unavailable',
      detail: `Radar regression data is unavailable (${evidence.regressions.error}), so the regression gate cannot be cleared`,
    })
  }
  blockingRegressions(evidence, version).forEach((regression) => {
    verdicts.push({code: 'regression', detail: describeRegression(regression)})
  })

  const present = facts?.packagesWithVersion ?? []
  const missing = evidence.packageSet.names.filter((name) =>
    present.every((entry) => entry !== name),
  )
  if (missing.length > 0) {
    verdicts.push({
      code: 'missing-packages',
      detail: `not published for ${missing.length} package${pluralSuffix(missing.length)}: ${missing.join(', ')}`,
    })
  }

  if (evidence.mode === 'live' && semver.gt(version, evidence.latest)) {
    verdicts.push({code: 'rolled-back', detail: `above current latest ${evidence.latest}`})
  }
  const rolledBack = rolledBackBy(evidence, version, publishedAt)
  if (rolledBack) {
    verdicts.push({
      code: 'rolled-back',
      detail: `latest was moved back to ${rolledBack.version} on ${rolledBack.at.slice(0, 10)}, below this version`,
    })
  }

  return verdicts
}

function sqrlOf(evidence: Evidence, version: string): SqrlFacts | null {
  if (evidence.sqrl.status === 'unavailable') return null
  const asOf = toTime(evidence.asOf)
  return (
    evidence.sqrl.data.find(
      (entry) => entry.version === version && toTime(entry.createdAt) <= asOf,
    ) ?? null
  )
}

function sqrlBaselineOf(
  evidence: Evidence,
  version: string,
  sqrl: SqrlFacts | null,
): number | null {
  if (sqrl === null || evidence.sqrl.status === 'unavailable') return null
  const asOf = toTime(evidence.asOf)
  const baseline = evidence.sqrl.data
    .filter(
      (entry) =>
        toTime(entry.createdAt) <= asOf &&
        entry.formulaVersion === sqrl.formulaVersion &&
        semver.lt(entry.version, version),
    )
    .sort((left, right) => semver.rcompare(left.version, right.version))
    .slice(0, SQRL_BASELINE_RELEASES)
  return baseline.length >= MIN_SQRL_BASELINE_POINTS
    ? median(baseline.map((entry) => entry.score))
    : null
}

function openIssuesFor(evidence: Evidence, version: string): IssueReport[] {
  if (evidence.issues.status === 'unavailable') return []
  const asOf = toTime(evidence.asOf)
  return evidence.issues.data.filter(
    (issue) =>
      toTime(issue.createdAt) <= asOf &&
      (issue.closedAt === null || toTime(issue.closedAt) > asOf) &&
      issue.labels.every((label) => label !== FEATURE_LABEL) &&
      issue.versionsMentioned.includes(version),
  )
}

function openInvestigationsFor(evidence: Evidence, version: string): Investigation[] {
  if (evidence.regressions.status === 'unavailable') return []
  return evidence.regressions.data.investigations.filter(
    (investigation) =>
      isRegressionKnown(evidence, investigation) &&
      semver.gt(version, investigation.goodVersion) &&
      semver.lte(version, investigation.badVersion),
  )
}

function downloadsOf(evidence: Evidence): Record<string, number> | null {
  if (evidence.mode === 'live' && evidence.downloads.status === 'ok') return evidence.downloads.data
  return null
}

function adoptionShareOf(evidence: Evidence, version: string): number | null {
  const downloads = downloadsOf(evidence)
  const latestMajor = semver.major(evidence.latest)
  if (downloads === null || semver.major(version) !== latestMajor) return null
  const total = Object.entries(downloads)
    .filter(([name]) => isStableRelease(name) && semver.major(name) === latestMajor)
    .reduce((sum, [, count]) => sum + count, 0)
  return total > 0 ? (downloads[version] ?? 0) / total : null
}

function pluralSuffix(count: number): string {
  return count === 1 ? '' : 's'
}

function percent(share: number): string {
  return `${roundTo(share * 100, 1)}%`
}

function softFlags(
  evidence: Evidence,
  version: string,
  details: {
    sqrl: SqrlFacts | null
    sqrlBaseline: number | null
    issues: IssueReport[]
    share: number | null
  },
): Verdict<SoftFlagCode>[] {
  const {sqrl, sqrlBaseline, issues, share} = details
  const verdicts: Verdict<SoftFlagCode>[] = []

  if (semver.patch(version) > 0) {
    verdicts.push({
      code: 'is-patch',
      detail: `patch release of ${semver.major(version)}.${semver.minor(version)}`,
    })
  }
  if (semver.major(version) > semver.major(evidence.currentStable)) {
    verdicts.push({
      code: 'major-upgrade',
      detail: `new major: ${semver.major(version)}.x supersedes stable's ${semver.major(evidence.currentStable)}.x line`,
    })
  }

  if (sqrl && sqrlBaseline !== null && sqrl.score < SQRL_DROP_RATIO * sqrlBaseline) {
    verdicts.push({
      code: 'sqrl-drop',
      detail: `SQRL ${roundTo(sqrl.score, 1)} is below ${roundTo(SQRL_DROP_RATIO * 100, 0)}% of the prior median ${roundTo(sqrlBaseline, 1)}`,
    })
  }
  if (sqrl && sqrl.regressedInputs.length > 0) {
    verdicts.push({
      code: 'sqrl-regressed-inputs',
      detail: `SQRL inputs regressed: ${sqrl.regressedInputs.join(', ')}`,
    })
  }
  if (sqrl && sqrl.reliabilityEvents > 0) {
    verdicts.push({
      code: 'sqrl-reliability',
      detail: `${sqrl.reliabilityEvents} SQRL reliability event${pluralSuffix(sqrl.reliabilityEvents)}`,
    })
  }
  if (evidence.sqrl.status === 'ok' && sqrl === null) {
    verdicts.push({code: 'sqrl-missing', detail: 'no SQRL score recorded for this release'})
  }

  if (issues.length > 0) {
    verdicts.push({
      code: 'open-issue-reports',
      detail: `open issue reports mention this version: ${issues.map((issue) => `#${issue.number}`).join(', ')}`,
    })
  }

  const investigations = openInvestigationsFor(evidence, version)
  if (investigations.length > 0) {
    verdicts.push({
      code: 'open-investigation',
      detail: `inside ${investigations.length} open bisect range${pluralSuffix(investigations.length)} (${investigations.map((entry) => `${entry.goodVersion} to ${entry.badVersion}`).join('; ')})`,
    })
  }

  const stableShare = adoptionShareOf(evidence, evidence.currentStable)
  if (
    share !== null &&
    stableShare !== null &&
    semver.major(evidence.currentStable) === semver.major(evidence.latest) &&
    share < stableShare
  ) {
    verdicts.push({
      code: 'adoption-below-stable',
      detail: `${percent(share)} of ${semver.major(evidence.latest)}.x downloads vs ${percent(stableShare)} for stable ${evidence.currentStable}`,
    })
  }

  return verdicts
}

function evaluateCandidate(evidence: Evidence, entry: Published): Candidate {
  const asOf = toTime(evidence.asOf)
  const publishedAt = toTime(entry.publishedAt)
  const hard = hardReasons(evidence, entry.version, publishedAt)
  const sqrl = sqrlOf(evidence, entry.version)
  const sqrlBaseline = sqrlBaselineOf(evidence, entry.version, sqrl)
  const issues = openIssuesFor(evidence, entry.version)
  const adoptionShare = adoptionShareOf(evidence, entry.version)
  return {
    version: entry.version,
    publishedAt: entry.publishedAt,
    ageDays: (asOf - publishedAt) / DAY_MS,
    eligible: hard.length === 0,
    eligibleFrom: new Date(
      publishedAt + soakDaysFor(evidence, entry.version) * DAY_MS,
    ).toISOString(),
    hard,
    urgentReason: urgentReasonOf(evidence, entry.version),
    soft: softFlags(evidence, entry.version, {sqrl, sqrlBaseline, issues, share: adoptionShare}),
    adoptionShare,
    sqrl,
    sqrlBaseline,
    openIssueNumbers: issues.map((issue) => issue.number),
  }
}

function stableAtRiskOf(evidence: Evidence): Verdict<'regression'>[] {
  return blockingRegressions(evidence, evidence.currentStable).map((regression) => ({
    code: 'regression' as const,
    detail: describeRegression(regression),
  }))
}

function stableSplitOf(evidence: Evidence): StableSplit | null {
  const tags = evidence.stableByPackage
  if (tags?.status === 'ok' && new Set(Object.values(tags.data)).size > 1) {
    return {sanityStable: tags.data[PACKAGE_NAME] ?? null, byPackage: tags.data}
  }
  return null
}

function urgentFirst(candidates: Candidate[]): string[] {
  const eligible = candidates.filter((candidate) => candidate.eligible)
  const urgent = eligible
    .filter((candidate) => candidate.urgentReason !== null && candidate.urgentReason !== undefined)
    .sort(
      (left, right) =>
        Number(right.urgentReason === 'stable-patch') -
          Number(left.urgentReason === 'stable-patch') ||
        semver.compare(left.version, right.version),
    )
  const rest = eligible.filter((candidate) => candidate.urgentReason == null)
  return [...urgent, ...rest].map((candidate) => candidate.version)
}

export function evaluate(evidence: Evidence): Evaluation {
  const asOf = toTime(evidence.asOf)
  const candidates = evidence.published
    .filter(
      (entry) =>
        isStableRelease(entry.version) &&
        toTime(entry.publishedAt) <= asOf &&
        semver.gt(entry.version, evidence.currentStable),
    )
    .sort((left, right) => semver.rcompare(left.version, right.version))
    .map((entry) => evaluateCandidate(evidence, entry))
  const eligible = urgentFirst(candidates)

  return {
    asOf: evidence.asOf,
    mode: evidence.mode,
    currentStable: evidence.currentStable,
    currentStableSince: evidence.currentStableSince,
    latest: evidence.latest,
    candidates,
    eligible,
    shortlist: eligible.slice(0, SHORTLIST_SIZE),
    stableAtRisk: stableAtRiskOf(evidence),
    stableSplit: stableSplitOf(evidence),
  }
}
