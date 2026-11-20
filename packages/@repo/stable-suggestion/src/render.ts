import semver from 'semver'

import {PACKAGE_NAME} from './config'
import {daysBetween} from './time'
import {
  type Candidate,
  type Evidence,
  type FallbackPayload,
  type ModelFailureReason,
  type Recommendation,
  type ShortlistEntry,
  type WebhookPayload,
} from './types'

export const SUGGESTION_WEBHOOK_FIELDS = {text: 'text', runUrl: 'run_url'} as const
export const CI_ALERTS_WEBHOOK_FIELDS = {text: 'text'} as const

export const DEFAULT_ESCAPE_LIMIT = 2000
const ISSUE_URL_BASE = 'https://github.com/sanity-io/sanity/issues'
const MAX_LISTED_VERSIONS = 6

function isPrintable(character: string): boolean {
  const code = character.codePointAt(0) ?? 0
  return code === 10 || (code >= 32 && code < 127) || code > 159
}

export function stripControlChars(text: string): string {
  return Array.from(text).filter(isPrintable).join('')
}

export function escapeSlack(text: string, maxLength: number = DEFAULT_ESCAPE_LIMIT): string {
  const clipped = text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
  return stripControlChars(clipped)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function toWebhookPayload(text: string, runUrl: string): WebhookPayload {
  return {
    [SUGGESTION_WEBHOOK_FIELDS.text]: text,
    [SUGGESTION_WEBHOOK_FIELDS.runUrl]: runUrl,
  }
}

export function toFallbackPayload(text: string): FallbackPayload {
  return {[CI_ALERTS_WEBHOOK_FIELDS.text]: text}
}

function encodeLinkUnsafe(character: string): string {
  return `%${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(2, '0')}`
}

export function workflowLink(runUrl: string): string {
  const safeUrl = stripControlChars(runUrl).replace(/[<>|\s]/g, encodeLinkUnsafe)
  return `<${safeUrl}|Open github workflow>`
}

function issueLink(issueNumber: number): string {
  return `<${ISSUE_URL_BASE}/${issueNumber}|#${issueNumber}>`
}

export function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function formatUtc(isoDate: string): string {
  return `${isoDate.slice(0, 10)} ${isoDate.slice(11, 16)} UTC`
}

function andMore(total: number): string {
  const remainder = total - MAX_LISTED_VERSIONS
  return remainder > 0 ? `, and ${remainder} more` : ''
}

function withoutNulls(lines: (string | null)[]): string[] {
  return lines.filter((line): line is string => line !== null)
}

function describeFallback(reason: ModelFailureReason | null): string {
  if (reason === 'disabled') return 'Claude skipped'
  if (reason === 'no-eligible-versions') return 'no eligible versions'
  return `Claude unavailable, ${reason ?? 'unknown'}`
}

function describeSource(recommendation: Recommendation): string {
  if (recommendation.source === 'model') {
    return `Claude, ${recommendation.confidence ?? 'unknown'} confidence`
  }
  return `deterministic: ${describeFallback(recommendation.fallbackReason)}`
}

function describeSqrl(candidate: Candidate, evidence: Evidence): string {
  if (evidence.sqrl.status === 'unavailable') return 'SQRL unavailable'
  if (candidate.sqrl === null) return 'SQRL missing'
  const score = candidate.sqrl.score.toFixed(1)
  const baseline = candidate.sqrlBaseline
  const change =
    baseline === null || baseline === 0
      ? ''
      : ` (${candidate.sqrl.score >= baseline ? '+' : ''}${Math.round((candidate.sqrl.score / baseline - 1) * 100)}% vs prior)`
  const regressed =
    candidate.sqrl.regressedInputs.length > 0
      ? `, ${candidate.sqrl.regressedInputs.map((input) => `\`${escapeSlack(input, 80)}\``).join(' ')} input regressed`
      : ''
  return `SQRL ${score}${change}${regressed}`
}

function describeAdoption(candidate: Candidate, evidence: Evidence): string | null {
  if (evidence.downloads.status === 'unavailable') return 'downloads unavailable'
  if (evidence.downloads.status === 'not-applicable') return null
  if (candidate.adoptionShare === null) return 'no download data'
  return `${(candidate.adoptionShare * 100).toFixed(1)}% of v6 downloads`
}

function describeReports(candidate: Candidate, evidence: Evidence): string {
  if (evidence.issues.status === 'unavailable') return 'issue reports unavailable'
  if (candidate.openIssueNumbers.length === 0) return 'no open reports'
  return `open reports ${candidate.openIssueNumbers.map(issueLink).join(' ')}`
}

function renderSlot(
  entry: ShortlistEntry,
  recommendation: Recommendation,
  evidence: Evidence,
): string {
  const candidate = recommendation.evaluation.candidates.find(
    (item) => item.version === entry.version,
  )
  const title = `*Slot ${entry.slot} · ${escapeSlack(entry.version, 40)}*`
  const facts = candidate
    ? withoutNulls([
        `${candidate.ageDays.toFixed(1)} days on latest`,
        describeSqrl(candidate, evidence),
        describeAdoption(candidate, evidence),
        describeReports(candidate, evidence),
      ])
    : []
  const reason = `> ${escapeSlack(singleLine(entry.reason), 300)}`
  return [[title, ...facts].join(' · '), reason].join('\n')
}

function describeHardReason(candidate: Candidate, code: string, detail: string): string {
  if (code === 'too-new') return `too new, eligible from ${formatUtc(candidate.eligibleFrom)}`
  return `${code}: ${singleLine(detail)}`
}

function renderNotEligible(candidates: Candidate[]): string | null {
  const blocked = candidates.filter((candidate) => !candidate.eligible)
  if (blocked.length === 0) return null
  const listed = blocked
    .slice(0, MAX_LISTED_VERSIONS)
    .map((candidate) => {
      const reasons = candidate.hard
        .map((verdict) => describeHardReason(candidate, verdict.code, verdict.detail))
        .join('; ')
      return `${escapeSlack(candidate.version, 40)} (${escapeSlack(reasons, 300)})`
    })
    .join(', ')
  return `Not eligible: ${listed}${andMore(blocked.length)}`
}

function renderNotShortlisted(recommendation: Recommendation): string | null {
  const shortlisted = new Set(recommendation.shortlist.map((entry) => entry.version))
  const rest = recommendation.evaluation.eligible.filter((version) => !shortlisted.has(version))
  if (rest.length === 0) return null
  const listed = rest.slice(0, MAX_LISTED_VERSIONS).map((version) => escapeSlack(version, 40))
  return `Not shortlisted: ${listed.join(', ')}${andMore(rest.length)} (eligible, older)`
}

function earliestEligibleFrom(candidates: Candidate[]): string | null {
  const waiting = candidates
    .filter((candidate) => candidate.hard.some((verdict) => verdict.code === 'too-new'))
    .map((candidate) => candidate.eligibleFrom)
    .sort()
  return waiting[0] ?? null
}

function renderHoldReasons(recommendation: Recommendation, evidence: Evidence): string[] {
  const radarDown = evidence.regressions.status === 'unavailable'
  const earliest = earliestEligibleFrom(recommendation.evaluation.candidates)
  return withoutNulls([
    radarDown ? 'hold: Radar unavailable, regression gate cannot be cleared' : null,
    earliest ? `Earliest a version becomes eligible: ${formatUtc(earliest)}` : null,
  ])
}

function renderHeader(recommendation: Recommendation): string {
  const latest = escapeSlack(recommendation.evaluation.latest, 40)
  if (recommendation.decision === 'hold') return ':double_vertical_bar: *@stable: hold*'
  return `:package: *@stable shortlist* after ${PACKAGE_NAME} ${latest} reached latest`
}

function renderStable(recommendation: Recommendation): string {
  const {evaluation} = recommendation
  const stable = escapeSlack(evaluation.currentStable, 40)
  const since = evaluation.currentStableSince
  const age = since
    ? ` (stable since ${since.slice(0, 10)}, ${daysBetween(since, evaluation.asOf)} days)`
    : ''
  const topPick = recommendation.shortlist[0]
  const call =
    recommendation.decision === 'promote' && topPick
      ? `*promote ${escapeSlack(topPick.version, 40)}*`
      : '*hold*'
  return `Current stable: *${stable}*${age}. Recommendation: ${call} (${describeSource(recommendation)})`
}

function renderMajorTransition(recommendation: Recommendation): string | null {
  const {currentStable} = recommendation.evaluation
  const stableMajor = semver.major(currentStable)
  const newerMajors = recommendation.shortlist
    .map((entry) => semver.major(entry.version))
    .filter((major) => major > stableMajor)
  const [newestMajor] = newerMajors.toSorted((left, right) => right - left)
  return newestMajor === undefined
    ? null
    : `:arrow_up: Major transition: stable is on ${stableMajor}.x and ${newestMajor}.x has shipped`
}

function urgentReasons(recommendation: Recommendation): string[] {
  const {evaluation} = recommendation
  const stable = escapeSlack(evaluation.currentStable, 40)
  const atRisk = evaluation.stableAtRisk.map(
    (verdict) =>
      `current stable ${stable} is affected by a confirmed regression: ${escapeSlack(singleLine(verdict.detail), 300)}`,
  )
  const patches = evaluation.candidates
    .filter((candidate) => candidate.urgentReason === 'stable-patch')
    .map((candidate) => `${escapeSlack(candidate.version, 40)} is a patch of stable ${stable}`)
  return [...atRisk, ...patches]
}

function renderUrgent(recommendation: Recommendation): string | null {
  const reasons = urgentReasons(recommendation)
  if (reasons.length === 0) return null
  const topPick = recommendation.shortlist[0]
  const next = topPick
    ? `Recommended: ${escapeSlack(topPick.version, 40)} (1 day soak applies).`
    : 'No version is eligible yet.'
  return `:rotating_light: Urgent: ${reasons.join('; ')}. ${next}`
}

function renderStableSplit(recommendation: Recommendation): string | null {
  const split = recommendation.evaluation.stableSplit
  if (!split) return null
  const describe = (name: string, tag: string | null) =>
    `${escapeSlack(name, 80)} → ${tag ? escapeSlack(tag, 40) : 'none'}`
  const others = Object.entries(split.byPackage).filter(
    ([name, tag]) => name !== PACKAGE_NAME && tag !== split.sanityStable,
  )
  const listed = [
    describe(PACKAGE_NAME, split.sanityStable),
    ...others.slice(0, MAX_LISTED_VERSIONS).map(([name, tag]) => describe(name, tag)),
  ].join(', ')
  const heal = split.sanityStable
    ? `Run \`gh workflow run tag-stable.yml -f version=${escapeSlack(split.sanityStable, 40)}\` to re-tag every package. `
    : ''
  return `:warning: stable is split across packages: ${listed}${andMore(others.length)}. ${heal}This does not block promotion: promoting a shortlisted version re-tags every package too.`
}

function renderRollbackNote(evidence: Evidence): string | null {
  return evidence.latestMoves?.status === 'ok'
    ? null
    : 'Latest rollback history unavailable, so rolled-back versions were not excluded.'
}

function renderConcerns(recommendation: Recommendation): string | null {
  if (recommendation.concerns.length === 0) return null
  const listed = recommendation.concerns
    .map(
      (concern) =>
        `${escapeSlack(concern.version, 40)}: ${escapeSlack(singleLine(concern.note), 300)}`,
    )
    .join('; ')
  return `Concerns: ${listed}`
}

export function renderShortlistText(
  recommendation: Recommendation,
  evidence: Evidence,
  runUrl: string,
): string {
  const {evaluation} = recommendation
  const topPick = recommendation.shortlist[0]
  const overrideVersion = topPick ? escapeSlack(topPick.version, 40) : 'X.Y.Z'
  const lines = [
    renderUrgent(recommendation),
    renderStableSplit(recommendation),
    renderHeader(recommendation),
    renderStable(recommendation),
    renderMajorTransition(recommendation),
    escapeSlack(singleLine(recommendation.headline), 200),
    escapeSlack(singleLine(recommendation.rationale), 1500),
    renderConcerns(recommendation),
    ...(recommendation.decision === 'hold' ? renderHoldReasons(recommendation, evidence) : []),
    '',
    ...recommendation.shortlist.map((entry) => renderSlot(entry, recommendation, evidence)),
    renderNotShortlisted(recommendation),
    renderNotEligible(evaluation.candidates),
    renderRollbackNote(evidence),
    '',
    recommendation.shortlist.length > 0
      ? 'To promote: open the run → Review deployments → tick only stable-candidate-N → Approve and deploy. Only one slot can promote.'
      : null,
    `Manual override: \`gh workflow run tag-stable.yml -f version=${overrideVersion}\``,
    workflowLink(runUrl),
  ]
  return withoutNulls(lines).join('\n')
}

function escapeMarkdown(text: string, maxLength: number): string {
  return escapeSlack(singleLine(text), maxLength).replaceAll('|', '\\|').replaceAll('`', "'")
}

function describeStatus(label: string, status: string): string {
  return `- ${label}: ${status}`
}

export function renderSummaryMarkdown(
  recommendation: Recommendation,
  evidence: Evidence,
  runUrl: string,
): string {
  const {evaluation} = recommendation
  const candidateRows = evaluation.candidates.map((candidate) => {
    const hard = candidate.hard.map((verdict) => verdict.code).join(', ')
    const soft = candidate.soft.map((verdict) => verdict.code).join(', ')
    return `| ${escapeMarkdown(candidate.version, 40)} | ${candidate.ageDays.toFixed(1)} | ${candidate.eligible ? 'yes' : 'no'} | ${escapeMarkdown(hard, 200)} | ${escapeMarkdown(soft, 200)} |`
  })
  const shortlistRows = recommendation.shortlist.map(
    (entry) =>
      `${entry.slot}. **${escapeMarkdown(entry.version, 40)}** - ${escapeMarkdown(entry.reason, 300)}`,
  )
  const lines = [
    '## @stable suggestion',
    '',
    `As of ${escapeMarkdown(evaluation.asOf, 40)} (${evaluation.mode}). Current stable ${escapeMarkdown(evaluation.currentStable, 40)}, latest ${escapeMarkdown(evaluation.latest, 40)}.`,
    `Recommendation: **${recommendation.decision}** (${escapeMarkdown(describeSource(recommendation), 200)}).`,
    '',
    escapeMarkdown(recommendation.headline, 200),
    '',
    escapeMarkdown(recommendation.rationale, 1500),
    '',
    '### Shortlist',
    ...(shortlistRows.length > 0 ? shortlistRows : ['None.']),
    '',
    '### Candidates',
    '| Version | Age (days) | Eligible | Hard | Soft |',
    '| --- | --- | --- | --- | --- |',
    ...candidateRows,
    '',
    '### Data',
    describeStatus('Regressions', evidence.regressions.status),
    describeStatus('SQRL', evidence.sqrl.status),
    describeStatus('Issues', evidence.issues.status),
    describeStatus('Downloads', evidence.downloads.status),
    '',
    `[Open github workflow](${stripControlChars(runUrl).replace(/[()\s]/g, encodeLinkUnsafe)})`,
  ]
  return lines.join('\n')
}
