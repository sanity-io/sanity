import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorReport,
  type Seam,
  type Verdict,
  type VerdictsFile,
} from './contracts'
import {type Explainer, type Explanation} from './explain'
import {
  differencesSection,
  ENGINE_SECTION_ORDER,
  ENGINE_SIGNATURE_PREFIX,
  engineIssueTitle,
  FAKE_SIGNATURE_PREFIX,
  fakeIssueTitle,
  hasBalancedFences,
  parseSections,
  printDefinition,
  realContentLakeSection,
  renderSections,
  reproSection,
  SECTION,
  type Section,
  signatureLineText,
  signatureSection,
} from './issueBody'
import {type LinearIssueRef, type LinearIssues, type NewLinearIssue} from './linear'

export interface ReportPair {
  report: GeneratorReport
  verdicts: VerdictsFile
}

export type IssueKind = 'engine' | 'fake-model'
export type OutcomeAction = 'filed' | 'would-file' | 'duplicate' | 'error'

export interface FailureOutcome {
  signature: string
  seam: Seam
  verdict?: Verdict
  kind?: IssueKind
  action: OutcomeAction
  issues?: LinearIssueRef[]
  title?: string
  body?: string
  reason?: string
}

export interface FileSummary {
  dryRun: boolean
  commits: string[]
  dedupe: 'linear' | 'skipped'
  outcomes: FailureOutcome[]
}

export interface FileOptions {
  dryRun: boolean
  linear?: LinearIssues
  explain: Explainer
}

interface PendingFailure {
  failure: GeneratorFailure
  verdict: FailureVerdict
  commit: string
  seam: Seam
}

interface Plan {
  pending: PendingFailure[]
  errors: FailureOutcome[]
}

const HYPOTHESIS_LABEL =
  'Hypothesis, written by the weekly sync verification job from the repro and the source. Not confirmed at runtime.'

const FAKE_WHAT_HAPPENS =
  'The weekly sync verification job replayed this generated failure against a fresh real Content Lake dataset, and the real server answered differently from the fake in `@repo/content-lake-model`. The failure may be an artefact of the fake, so fix the fake (or confirm the difference does not matter) before treating it as an engine bug.'

function pairErrors({report, verdicts}: ReportPair): FailureOutcome[] {
  const reasons = [
    verdicts.commit === report.commit
      ? undefined
      : `verdicts are for commit ${verdicts.commit}, report is for ${report.commit}`,
    verdicts.seam === report.seam
      ? undefined
      : `verdicts are for the ${verdicts.seam} seam, report is for ${report.seam}`,
  ].filter((reason): reason is string => reason !== undefined)
  return reasons.length === 0
    ? []
    : report.failures.map((failure) => ({
        signature: failure.signature,
        seam: report.seam,
        action: 'error' as const,
        reason: reasons.join('; '),
      }))
}

function planPair(pair: ReportPair): Plan {
  const mismatch = pairErrors(pair)
  if (mismatch.length > 0) return {pending: [], errors: mismatch}
  const {report, verdicts} = pair
  const verdictsBySignature = new Map(
    verdicts.verdicts.map((verdict) => [verdict.signature, verdict]),
  )
  const failureSignatures = new Set(report.failures.map((failure) => failure.signature))
  const orphanVerdicts = verdicts.verdicts.flatMap<FailureOutcome>((verdict) =>
    failureSignatures.has(verdict.signature)
      ? []
      : [
          {
            signature: verdict.signature,
            seam: report.seam,
            verdict: verdict.verdict,
            action: 'error',
            reason: 'verdict has no matching failure in the report',
          },
        ],
  )
  const missingVerdicts = report.failures.flatMap<FailureOutcome>((failure) =>
    verdictsBySignature.has(failure.signature)
      ? []
      : [
          {
            signature: failure.signature,
            seam: report.seam,
            action: 'error',
            reason: 'no verdict for this failure',
          },
        ],
  )
  const pending = report.failures.flatMap<PendingFailure>((failure) => {
    const verdict = verdictsBySignature.get(failure.signature)
    return verdict ? [{failure, verdict, commit: report.commit, seam: report.seam}] : []
  })
  return {pending, errors: [...orphanVerdicts, ...missingVerdicts]}
}

function issueKind(verdict: Verdict): IssueKind {
  return verdict === 'fake-mismatch' ? 'fake-model' : 'engine'
}

function signatureLine(kind: IssueKind, signature: string) {
  return {
    prefix: kind === 'engine' ? ENGINE_SIGNATURE_PREFIX : FAKE_SIGNATURE_PREFIX,
    signature,
  }
}

function scriptOwnedSections(pending: PendingFailure, kind: IssueKind): Section[] {
  return [
    {heading: SECTION.repro, body: reproSection(pending.failure, pending.commit)},
    {heading: SECTION.realContentLake, body: realContentLakeSection(pending.verdict)},
    {
      heading: SECTION.signature,
      body: signatureSection(signatureLine(kind, pending.failure.signature)),
    },
  ]
}

export function engineIssueBody(pending: PendingFailure, explanation: Explanation): string {
  return renderSections([
    {heading: SECTION.whatHappens, body: explanation.whatHappens},
    {heading: SECTION.userImpact, body: explanation.userImpact},
    {heading: SECTION.likelyCause, body: `${HYPOTHESIS_LABEL}\n\n${explanation.likelyCause}`},
    ...scriptOwnedSections(pending, 'engine'),
  ])
}

function fakeIssueBody(pending: PendingFailure): string {
  return renderSections([
    {heading: SECTION.whatHappens, body: FAKE_WHAT_HAPPENS},
    {heading: SECTION.differences, body: differencesSection(pending.verdict)},
    ...scriptOwnedSections(pending, 'fake-model'),
  ])
}

function countSignatureLines(body: string): number {
  return body
    .split('\n')
    .filter((line) =>
      [ENGINE_SIGNATURE_PREFIX, FAKE_SIGNATURE_PREFIX].some((prefix) =>
        line.trim().startsWith(prefix.trim()),
      ),
    ).length
}

export function scriptSectionProblems(
  body: string,
  pending: PendingFailure,
  explanation: Explanation,
): string[] {
  const sections = parseSections(body)
  const headings = sections.map((section) => section.heading)
  const expectedOwned = scriptOwnedSections(pending, 'engine')
  const ownedProblems = expectedOwned.flatMap((expected) => {
    const actual = sections.find((section) => section.heading === expected.heading)
    return actual?.body === expected.body.trim()
      ? []
      : [`the ${expected.heading} section differs from the script's`]
  })
  const unbalanced = Object.entries(explanation).flatMap(([key, text]) =>
    hasBalancedFences(text) ? [] : [`the AI-written ${key} has an unclosed code fence`],
  )
  return [
    headings.join('|') === ENGINE_SECTION_ORDER.join('|')
      ? undefined
      : `sections are [${headings.join(', ')}], expected [${ENGINE_SECTION_ORDER.join(', ')}]`,
    ...ownedProblems,
    ...unbalanced,
    countSignatureLines(body) === 1 ? undefined : 'the body must carry exactly one signature line',
  ].filter((problem): problem is string => problem !== undefined)
}

async function buildIssue(
  pending: PendingFailure,
  kind: IssueKind,
  explain: Explainer,
): Promise<NewLinearIssue> {
  const fields = pending.failure.signatureFields
  if (kind === 'fake-model') {
    return {title: fakeIssueTitle(fields), description: fakeIssueBody(pending)}
  }
  const title = engineIssueTitle(fields)
  const explanation = await explain({
    title,
    signature: pending.failure.signature,
    message: pending.failure.message,
    definitionLiteral: printDefinition(pending.failure),
    seam: pending.seam,
    realContentLake: realContentLakeSection(pending.verdict),
  })
  const description = engineIssueBody(pending, explanation)
  const problems = scriptSectionProblems(description, pending, explanation)
  if (problems.length > 0) {
    throw new Error(`Refusing to file: ${problems.join('; ')}`)
  }
  return {title, description}
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function handle(
  pending: PendingFailure,
  options: FileOptions,
  seenLines: Map<string, FailureOutcome>,
): Promise<FailureOutcome> {
  const {failure, verdict, seam} = pending
  const base = {signature: failure.signature, seam, verdict: verdict.verdict}
  if (verdict.verdict === 'error') {
    return {...base, action: 'error', reason: `verify failed: ${verdict.summary}`}
  }
  const kind = issueKind(verdict.verdict)
  const line = signatureLineText(signatureLine(kind, failure.signature))
  const earlier = seenLines.get(line)
  if (earlier) {
    return {
      ...base,
      kind,
      action: 'duplicate',
      issues: earlier.issues,
      reason: `also found on the ${earlier.seam} seam in this run`,
    }
  }
  try {
    const existing = options.linear ? await options.linear.findBySignatureLine(line) : []
    if (existing.length > 0) {
      return {...base, kind, action: 'duplicate', issues: existing}
    }
    const issue = await buildIssue(pending, kind, options.explain)
    if (options.dryRun) {
      return {...base, kind, action: 'would-file', title: issue.title, body: issue.description}
    }
    const created = await options.linear?.create(issue)
    return {...base, kind, action: 'filed', title: issue.title, issues: created ? [created] : []}
  } catch (error) {
    return {...base, kind, action: 'error', reason: messageOf(error)}
  }
}

export async function fileFailures(
  pairs: ReportPair[],
  options: FileOptions,
): Promise<FileSummary> {
  const plans = pairs.map(planPair)
  const pending = plans.flatMap((plan) => plan.pending)
  const seenLines = new Map<string, FailureOutcome>()
  const handled = await pending.reduce<Promise<FailureOutcome[]>>(async (previous, item) => {
    const outcomes = await previous
    const outcome = await handle(item, options, seenLines)
    if (outcome.kind && outcome.action !== 'error') {
      seenLines.set(signatureLineText(signatureLine(outcome.kind, outcome.signature)), outcome)
    }
    return [...outcomes, outcome]
  }, Promise.resolve([]))
  return {
    dryRun: options.dryRun,
    commits: [...new Set(pairs.map((pair) => pair.report.commit))],
    dedupe: options.linear ? 'linear' : 'skipped',
    outcomes: [...handled, ...plans.flatMap((plan) => plan.errors)],
  }
}

function issueLinks(outcome: FailureOutcome): string {
  return (outcome.issues ?? []).map((issue) => `[${issue.identifier}](${issue.url})`).join(', ')
}

function outcomeLine(outcome: FailureOutcome): string {
  const links = issueLinks(outcome)
  const details = [
    outcome.title ? `"${outcome.title}"` : undefined,
    links === '' ? undefined : links,
    outcome.reason,
  ].filter((detail): detail is string => detail !== undefined)
  return `- \`${outcome.signature}\` (${outcome.seam}${outcome.verdict ? `, ${outcome.verdict}` : ''})${details.length > 0 ? `: ${details.join(', ')}` : ''}`
}

function group(title: string, outcomes: FailureOutcome[]): string[] {
  return outcomes.length === 0 ? [] : [`### ${title}`, '', ...outcomes.map(outcomeLine), '']
}

export function summaryMarkdown(summary: FileSummary): string {
  const byAction = (action: OutcomeAction, kind?: IssueKind) =>
    summary.outcomes.filter(
      (outcome) => outcome.action === action && (kind === undefined || outcome.kind === kind),
    )
  const filedHeading = summary.dryRun ? 'Would file (dry run)' : 'Filed'
  const filedAction: OutcomeAction = summary.dryRun ? 'would-file' : 'filed'
  const dedupeNote = summary.dedupe === 'linear' ? [] : ['Dedupe skipped: no `LINEAR_API_KEY`.', '']
  const lines = [
    `## Sync verification: ${summary.outcomes.length} distinct failure${summary.outcomes.length === 1 ? '' : 's'}`,
    '',
    `Commit ${summary.commits.map((commit) => `\`${commit}\``).join(', ') || 'none'}.`,
    '',
    ...dedupeNote,
    ...group(`${filedHeading}: engine bugs`, byAction(filedAction, 'engine')),
    ...group(`${filedHeading}: fake model differences`, byAction(filedAction, 'fake-model')),
    ...group('Already filed', byAction('duplicate')),
    ...group('Errors (nothing filed)', byAction('error')),
  ]
  const bodies = summary.dryRun
    ? byAction('would-file').flatMap((outcome) => [
        `<details><summary>${outcome.title}</summary>`,
        '',
        outcome.body ?? '',
        '',
        '</details>',
        '',
      ])
    : []
  return [...lines, ...bodies].join('\n')
}
