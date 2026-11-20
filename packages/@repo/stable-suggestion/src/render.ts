import semver from 'semver'

import {PACKAGE_NAME, TEXT_LIMITS} from './config'
import {TAG_STABLE_WORKFLOW} from './sources/github'
import {daysBetween} from './time'
import {
  type Candidate,
  type Evidence,
  type FallbackPayload,
  type ModelFailureReason,
  type Recommendation,
  type ShortlistMessage,
  type ShortlistEntry,
  type WebhookPayload,
} from './types'

export const SUGGESTION_WEBHOOK_FIELDS = {
  headline: 'headline',
  text: 'text',
  cli: 'cli',
  runUrl: 'run_url',
} as const
export const CI_ALERTS_WEBHOOK_FIELDS = {text: 'text'} as const

export const EMPTY_WEBHOOK_VALUE = '-'
const DEFAULT_ESCAPE_LIMIT = 2000
const MAX_LISTED_VERSIONS = 6
const MAX_LISTED_BLOCKED = 3
const SLOT_REASON_LIMIT = 140

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

export function toWebhookPayload(message: ShortlistMessage, runUrl: string): WebhookPayload {
  return {
    [SUGGESTION_WEBHOOK_FIELDS.headline]: message.headline,
    [SUGGESTION_WEBHOOK_FIELDS.text]: message.text,
    [SUGGESTION_WEBHOOK_FIELDS.cli]: message.cli ?? EMPTY_WEBHOOK_VALUE,
    [SUGGESTION_WEBHOOK_FIELDS.runUrl]: runUrl,
  }
}

export function toFallbackPayload(message: ShortlistMessage): FallbackPayload {
  const cliLine = message.cli ? `\nFrom the CLI: \`${message.cli}\`` : ''
  return {[CI_ALERTS_WEBHOOK_FIELDS.text]: `*${message.headline}*\n\n${message.text}${cliLine}`}
}

function encodeLinkUnsafe(character: string): string {
  return `%${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(2, '0')}`
}

interface RenderLinks {
  runUrl: string
  workflowUrl: string
}

function bareUrl(url: string): string {
  return stripControlChars(url).replace(/[<>|\s]/g, encodeLinkUnsafe)
}

function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function formatUtc(isoDate: string): string {
  return `${isoDate.slice(0, 10)} ${isoDate.slice(11, 16)} UTC`
}

function andMore(total: number, listed: number): string {
  const remainder = total - listed
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

function overrideCommand(version: string): string {
  return `gh workflow run ${TAG_STABLE_WORKFLOW} -f version=${version}`
}

function promoteInstruction(workflowUrl: string, exampleVersion: string): string {
  return `open ${bareUrl(workflowUrl)}, click Run workflow, enter the version (for example ${exampleVersion}).`
}

function renderHeadline(recommendation: Recommendation): string {
  const latest = escapeSlack(recommendation.evaluation.latest, 40)
  const topPick = recommendation.shortlist[0]
  if (recommendation.decision === 'hold' || topPick === undefined) {
    return `@stable: hold after ${PACKAGE_NAME} ${latest} reached latest`
  }
  return `@stable shortlist after ${PACKAGE_NAME} ${latest} reached latest - recommend ${escapeSlack(topPick.version, 40)}`
}

function renderStable(recommendation: Recommendation): string {
  const {evaluation} = recommendation
  const since = evaluation.currentStableSince
  const age = since
    ? ` (since ${since.slice(0, 10)}, ${daysBetween(since, evaluation.asOf)} days)`
    : ''
  return `Current stable: ${escapeSlack(evaluation.currentStable, 40)}${age}`
}

export function shortenAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const clipped = text.slice(0, maxLength - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  const wholeWords = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped
  return `${wholeWords.replace(/[\s,;:.-]+$/, '')}…`
}

function renderSlot(entry: ShortlistEntry, position: number): string {
  const reason = escapeSlack(shortenAtWord(singleLine(entry.reason), SLOT_REASON_LIMIT))
  return `${position}) ${escapeSlack(entry.version, 40)} - ${reason}`
}

function describeHardReason(candidate: Candidate, code: string): string {
  return code === 'too-new' ? `too new until ${formatUtc(candidate.eligibleFrom)}` : code
}

function renderNotEligible(candidates: Candidate[]): string | null {
  const blocked = candidates.filter((candidate) => !candidate.eligible)
  if (blocked.length === 0) return null
  const listed = blocked
    .slice(0, MAX_LISTED_BLOCKED)
    .map((candidate) => {
      const reasons = candidate.hard
        .map((verdict) => describeHardReason(candidate, verdict.code))
        .join(', ')
      return `${escapeSlack(candidate.version, 40)} (${escapeSlack(reasons, 120)})`
    })
    .join(', ')
  return `Not eligible: ${listed}${andMore(blocked.length, MAX_LISTED_BLOCKED)}`
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
    radarDown ? 'Hold: Radar unavailable, regression gate cannot be cleared' : null,
    earliest ? `Earliest a version becomes eligible: ${formatUtc(earliest)}` : null,
  ])
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
    : `Major transition: stable is on ${stableMajor}.x and ${newestMajor}.x has shipped`
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
  const topCandidate = recommendation.evaluation.candidates.find(
    (candidate) => candidate.version === topPick?.version,
  )
  const soak = topCandidate?.urgentReason ? ' (1 day soak applies)' : ''
  const next = topPick
    ? `Recommended: ${escapeSlack(topPick.version, 40)}${soak}.`
    : 'No version is eligible yet.'
  return `Urgent: ${reasons.join('; ')}. ${next}`
}

function renderStableSplit(recommendation: Recommendation): string | null {
  const split = recommendation.evaluation.stableSplit
  if (!split) return null
  const describe = (name: string, tag: string | null) =>
    `${escapeSlack(name, 80)} -> ${tag ? escapeSlack(tag, 40) : 'none'}`
  const others = Object.entries(split.byPackage).filter(
    ([name, tag]) => name !== PACKAGE_NAME && tag !== split.sanityStable,
  )
  const listed = [
    describe(PACKAGE_NAME, split.sanityStable),
    ...others.slice(0, MAX_LISTED_VERSIONS).map(([name, tag]) => describe(name, tag)),
  ].join(', ')
  return `Stable is split across packages: ${listed}${andMore(others.length, MAX_LISTED_VERSIONS)}. Promoting a shortlisted version re-tags every package.`
}

export function renderShortlist(
  recommendation: Recommendation,
  evidence: Evidence,
  links: RenderLinks,
): ShortlistMessage {
  const topPick = recommendation.shortlist[0]
  const exampleVersion = topPick ? escapeSlack(topPick.version, 40) : 'X.Y.Z'
  const banners = withoutNulls([
    renderUrgent(recommendation),
    renderStableSplit(recommendation),
    renderMajorTransition(recommendation),
    ...(recommendation.decision === 'hold' ? renderHoldReasons(recommendation, evidence) : []),
    renderNotEligible(recommendation.evaluation.candidates),
  ])
  const slots = recommendation.shortlist.map((entry, index) => renderSlot(entry, index + 1))
  const lines = [
    renderStable(recommendation),
    '',
    ...slots,
    ...(slots.length > 0 ? [''] : []),
    ...banners,
    ...(banners.length > 0 ? [''] : []),
    topPick
      ? `To promote: ${promoteInstruction(links.workflowUrl, exampleVersion)} The result posts here.`
      : null,
    `Full reasoning: ${bareUrl(links.runUrl)}`,
  ]
  return {
    headline: renderHeadline(recommendation),
    text: withoutNulls(lines).join('\n'),
    cli: topPick ? overrideCommand(exampleVersion) : null,
  }
}

function escapeMarkdown(text: string, maxLength: number): string {
  return escapeSlack(singleLine(text), maxLength).replaceAll('|', '\\|').replaceAll('`', "'")
}

function describeStatus(label: string, status: string): string {
  return `- ${label}: ${status}`
}

function renderRollbackNote(evidence: Evidence): string | null {
  return evidence.latestMoves?.status === 'ok'
    ? null
    : '- Latest rollback history unavailable, so rolled-back versions were not excluded.'
}

function renderPromoteSection(recommendation: Recommendation, links: RenderLinks): string[] {
  const topPick = recommendation.shortlist[0]
  const exampleVersion = topPick ? escapeMarkdown(topPick.version, 40) : 'X.Y.Z'
  const rows = recommendation.shortlist.map(
    (entry) =>
      `| ${escapeMarkdown(entry.version, 40)} | ${escapeMarkdown(entry.reason, TEXT_LIMITS.reason)} |`,
  )
  const table =
    rows.length > 0
      ? ['| Version | Why |', '| --- | --- |', ...rows]
      : ['No version is eligible yet.']
  return [
    '### How to promote',
    '',
    ...(topPick
      ? [
          `${promoteInstruction(links.workflowUrl, exampleVersion).replace(/^open/, 'Open')} The result posts to Slack.`,
          '',
        ]
      : []),
    ...table,
    '',
    `From the CLI: \`${overrideCommand(exampleVersion)}\``,
  ]
}

function renderConcernsMarkdown(recommendation: Recommendation): string[] {
  if (recommendation.concerns.length === 0) return []
  return [
    '',
    '#### Concerns',
    ...recommendation.concerns.map(
      (concern) => `- ${escapeMarkdown(concern.version, 40)}: ${escapeMarkdown(concern.note, 300)}`,
    ),
  ]
}

export function renderSummaryMarkdown(
  recommendation: Recommendation,
  evidence: Evidence,
  links: RenderLinks,
): string {
  const {evaluation} = recommendation
  const candidateRows = evaluation.candidates.map((candidate) => {
    const hard = candidate.hard.map((verdict) => verdict.code).join(', ')
    const soft = candidate.soft.map((verdict) => verdict.code).join(', ')
    return `| ${escapeMarkdown(candidate.version, 40)} | ${candidate.ageDays.toFixed(1)} | ${candidate.eligible ? 'yes' : 'no'} | ${escapeMarkdown(hard, 200)} | ${escapeMarkdown(soft, 200)} |`
  })
  const lines = [
    '## @stable suggestion',
    '',
    ...renderPromoteSection(recommendation, links),
    '',
    '### Reasoning',
    '',
    `As of ${escapeMarkdown(evaluation.asOf, 40)} (${evaluation.mode}). Current stable ${escapeMarkdown(evaluation.currentStable, 40)}, latest ${escapeMarkdown(evaluation.latest, 40)}.`,
    `Recommendation: **${recommendation.decision}** (${escapeMarkdown(describeSource(recommendation), 200)}).`,
    '',
    escapeMarkdown(recommendation.headline, 200),
    '',
    escapeMarkdown(recommendation.rationale, 1500),
    ...renderConcernsMarkdown(recommendation),
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
    ...withoutNulls([renderRollbackNote(evidence)]),
  ]
  return lines.join('\n')
}
