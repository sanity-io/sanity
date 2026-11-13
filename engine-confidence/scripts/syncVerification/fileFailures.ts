import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorReport,
  type GeneratorSample,
  type SampleVerdict,
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
  evidenceSection,
  FAKE_SIGNATURE_PREFIX,
  fakeIssueTitle,
  hasBalancedFences,
  parseSections,
  printDefinition,
  realContentLakeSection,
  renderSections,
  type ReplayResult,
  type ReproSource,
  reproSection,
  SECTION,
  type Section,
  type SignatureLine,
  signatureLineText,
  signatureSection,
} from './issueBody'
import {type LinearIssueRef, type LinearIssues, type NewLinearIssue} from './linear'

export interface ReportPair {
  report: GeneratorReport
  verdicts: VerdictsFile
}

export type IssueKind = 'engine' | 'fake-model'
export type OutcomeAction = 'filed' | 'would-file' | 'duplicate' | 'known-bug' | 'error'
export type OutcomeSource = 'failure' | 'sample'

export interface FailureOutcome {
  source: OutcomeSource
  signature: string
  seam?: Seam
  verdict?: Verdict
  kind?: IssueKind
  action: OutcomeAction
  issues?: LinearIssueRef[]
  title?: string
  body?: string
  reason?: string
}

export interface FakeFidelity {
  samples: number
  replayed: number
  matched: number
  mismatched: number
  errors: number
  nothingToReplay: number
  submissions: number
}

export interface FileSummary {
  dryRun: boolean
  commits: string[]
  dedupe: 'linear' | 'skipped'
  fidelity: FakeFidelity
  outcomes: FailureOutcome[]
}

export interface FileOptions {
  dryRun: boolean
  linear?: LinearIssues
  explain: Explainer
}

interface WorkItem {
  source: OutcomeSource
  signature: string
  seam: Seam
  commit: string
  repro: ReproSource
  result: ReplayResult & {fakeSignature?: string}
  failure?: GeneratorFailure
}

interface Plan {
  failures: WorkItem[]
  samples: WorkItem[]
  errors: FailureOutcome[]
}

const HYPOTHESIS_LABEL =
  'Hypothesis, written by the weekly sync verification job from the repro and the source. Not confirmed at runtime.'

const FAKE_WHAT_HAPPENS: Record<OutcomeSource, string> = {
  failure:
    'The weekly sync verification job replayed this generated failure against a fresh real Content Lake dataset, and the real server answered differently from the fake in `@repo/content-lake-model`. The failure may be an artefact of the fake, so fix the fake (or confirm the difference does not matter) before treating it as an engine bug.',
  sample:
    'The weekly sync verification job replayed a passing generated sequence against a fresh real Content Lake dataset, and the real server answered differently from the fake in `@repo/content-lake-model`. The fake is kinder or stricter than the real server here, so the sync tests can miss a bug or report one that cannot happen. Fix the fake, or confirm the difference does not matter.',
}

function sampleKey({seed, runIndex}: {seed: number; runIndex: number}): string {
  return `${seed}:${runIndex}`
}

function sampleLabel({seed, runIndex}: {seed: number; runIndex: number}): string {
  return `sample seed ${seed} run ${runIndex}`
}

function pairErrors({report, verdicts}: ReportPair): FailureOutcome[] {
  const reasons = [
    verdicts.commit === report.commit
      ? undefined
      : `verdicts are for commit ${verdicts.commit}, report is for ${report.commit}`,
    verdicts.seam === report.seam
      ? undefined
      : `verdicts are for the ${verdicts.seam} seam, report is for ${report.seam}`,
  ].filter((reason): reason is string => reason !== undefined)
  if (reasons.length === 0) return []
  const reason = reasons.join('; ')
  return [
    ...report.failures.map((failure) => ({
      signature: failure.signature,
      source: 'failure' as const,
    })),
    ...(report.samples ?? []).map((sample) => ({
      signature: sampleLabel(sample),
      source: 'sample' as const,
    })),
  ].map(({signature, source}) => ({source, signature, seam: report.seam, action: 'error', reason}))
}

function failureItem(
  failure: GeneratorFailure,
  verdict: FailureVerdict,
  report: GeneratorReport,
): WorkItem {
  return {
    source: 'failure',
    signature: failure.signature,
    seam: report.seam,
    commit: report.commit,
    repro: failure,
    result: verdict,
    failure,
  }
}

function sampleItem(
  sample: GeneratorSample,
  verdict: SampleVerdict,
  report: GeneratorReport,
): WorkItem {
  return {
    source: 'sample',
    signature: verdict.fakeSignature ?? sampleLabel(sample),
    seam: report.seam,
    commit: report.commit,
    repro: sample,
    result: verdict,
  }
}

function planFailures(report: GeneratorReport, verdicts: VerdictsFile) {
  const verdictsBySignature = new Map(
    verdicts.verdicts.map((verdict) => [verdict.signature, verdict]),
  )
  const failureSignatures = new Set(report.failures.map((failure) => failure.signature))
  const orphans = verdicts.verdicts.flatMap<FailureOutcome>((verdict) =>
    failureSignatures.has(verdict.signature)
      ? []
      : [
          {
            source: 'failure',
            signature: verdict.signature,
            seam: report.seam,
            verdict: verdict.verdict,
            action: 'error',
            reason: 'verdict has no matching failure in the report',
          },
        ],
  )
  const missing = report.failures.flatMap<FailureOutcome>((failure) =>
    verdictsBySignature.has(failure.signature)
      ? []
      : [
          {
            source: 'failure',
            signature: failure.signature,
            seam: report.seam,
            action: 'error',
            reason: 'no verdict for this failure',
          },
        ],
  )
  const items = report.failures.flatMap((failure) => {
    const verdict = verdictsBySignature.get(failure.signature)
    return verdict ? [failureItem(failure, verdict, report)] : []
  })
  return {items, errors: [...orphans, ...missing]}
}

function planSamples(report: GeneratorReport, verdicts: VerdictsFile) {
  const samples = report.samples ?? []
  const sampleVerdicts = verdicts.samples ?? []
  const verdictsByKey = new Map(sampleVerdicts.map((verdict) => [sampleKey(verdict), verdict]))
  const sampleKeys = new Set(samples.map(sampleKey))
  const orphans = sampleVerdicts.flatMap<FailureOutcome>((verdict) =>
    sampleKeys.has(sampleKey(verdict))
      ? []
      : [
          {
            source: 'sample',
            signature: sampleLabel(verdict),
            seam: report.seam,
            verdict: verdict.verdict,
            action: 'error',
            reason: 'sample verdict has no matching sample in the report',
          },
        ],
  )
  const missing = samples.flatMap<FailureOutcome>((sample) =>
    verdictsByKey.has(sampleKey(sample))
      ? []
      : [
          {
            source: 'sample',
            signature: sampleLabel(sample),
            seam: report.seam,
            action: 'error',
            reason: 'no verdict for this sample',
          },
        ],
  )
  const items = samples.flatMap((sample) => {
    const verdict = verdictsByKey.get(sampleKey(sample))
    return verdict && verdict.verdict !== 'confirmed' ? [sampleItem(sample, verdict, report)] : []
  })
  return {items, errors: [...orphans, ...missing]}
}

function planPair(pair: ReportPair): Plan {
  const mismatch = pairErrors(pair)
  if (mismatch.length > 0) return {failures: [], samples: [], errors: mismatch}
  const failures = planFailures(pair.report, pair.verdicts)
  const samples = planSamples(pair.report, pair.verdicts)
  return {
    failures: failures.items,
    samples: samples.items,
    errors: [...failures.errors, ...samples.errors],
  }
}

function fidelityOf(pairs: ReportPair[]): FakeFidelity {
  const verdicts = pairs.flatMap((pair) =>
    pairErrors(pair).length > 0 ? [] : (pair.verdicts.samples ?? []),
  )
  const count = (verdict: SampleVerdict['verdict'], replayedSome: boolean) =>
    verdicts.filter((sample) => sample.verdict === verdict && sample.replayed > 0 === replayedSome)
      .length
  const matched = count('confirmed', true)
  const mismatched = count('fake-mismatch', true) + count('fake-mismatch', false)
  return {
    samples: verdicts.length,
    replayed: matched + mismatched,
    matched,
    mismatched,
    errors: count('error', true) + count('error', false),
    nothingToReplay: count('confirmed', false),
    submissions: verdicts.reduce((total, sample) => total + sample.replayed, 0),
  }
}

function issueKind(verdict: Verdict): IssueKind {
  return verdict === 'fake-mismatch' ? 'fake-model' : 'engine'
}

function signatureLine(item: WorkItem, kind: IssueKind): SignatureLine | undefined {
  if (kind === 'engine') return {prefix: ENGINE_SIGNATURE_PREFIX, signature: item.signature}
  const fakeSignature = item.result.fakeSignature
  return fakeSignature === undefined
    ? undefined
    : {prefix: FAKE_SIGNATURE_PREFIX, signature: fakeSignature}
}

function scriptOwnedSections(item: WorkItem, line: SignatureLine): Section[] {
  return [
    {heading: SECTION.repro, body: reproSection(item.repro, item.commit)},
    {heading: SECTION.evidence, body: evidenceSection(item.result.verdict, item.repro.definition)},
    {heading: SECTION.realContentLake, body: realContentLakeSection(item.result)},
    {heading: SECTION.signature, body: signatureSection(line)},
  ]
}

function engineIssueBody(item: WorkItem, line: SignatureLine, explanation: Explanation): string {
  return renderSections([
    {heading: SECTION.whatHappens, body: explanation.whatHappens},
    {heading: SECTION.userImpact, body: explanation.userImpact},
    {heading: SECTION.likelyCause, body: `${HYPOTHESIS_LABEL}\n\n${explanation.likelyCause}`},
    ...scriptOwnedSections(item, line),
  ])
}

function fakeIssueBody(item: WorkItem, line: SignatureLine): string {
  return renderSections([
    {heading: SECTION.whatHappens, body: FAKE_WHAT_HAPPENS[item.source]},
    {heading: SECTION.differences, body: differencesSection(item.result)},
    ...scriptOwnedSections(item, line),
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

function scriptSectionProblems(
  body: string,
  item: WorkItem,
  line: SignatureLine,
  explanation: Explanation,
): string[] {
  const sections = parseSections(body)
  const headings = sections.map((section) => section.heading)
  const ownedProblems = scriptOwnedSections(item, line).flatMap((expected) => {
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

function engineTitle(failure: GeneratorFailure, verdict: Verdict): string {
  const title = engineIssueTitle(failure.signatureFields)
  return verdict === 'assumed' ? `constrain the generator or find a repro: ${title}` : title
}

async function buildEngineIssue(
  item: WorkItem,
  failure: GeneratorFailure,
  line: SignatureLine,
  explain: Explainer,
): Promise<NewLinearIssue> {
  const title = engineTitle(failure, item.result.verdict)
  const explanation = await explain({
    title,
    signature: failure.signature,
    message: failure.message,
    definitionLiteral: printDefinition(failure),
    seam: item.seam,
    evidence: evidenceSection(item.result.verdict, item.repro.definition),
    realContentLake: realContentLakeSection(item.result),
  })
  const description = engineIssueBody(item, line, explanation)
  const problems = scriptSectionProblems(description, item, line, explanation)
  if (problems.length > 0) {
    throw new Error(`Refusing to file: ${problems.join('; ')}`)
  }
  return {title, description}
}

async function buildIssue(
  item: WorkItem,
  line: SignatureLine,
  kind: IssueKind,
  explain: Explainer,
): Promise<NewLinearIssue> {
  if (kind === 'engine' && item.failure) {
    return buildEngineIssue(item, item.failure, line, explain)
  }
  return {title: fakeIssueTitle(line.signature), description: fakeIssueBody(item, line)}
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function duplicateReason(earlier: FailureOutcome, item: WorkItem): string {
  if (earlier.source === item.source) return `also found on the ${earlier.seam} seam in this run`
  return earlier.source === 'failure'
    ? `the same gap as failure \`${earlier.signature}\` in this run`
    : `the same gap as a passing sample in this run`
}

async function handle(
  item: WorkItem,
  options: FileOptions,
  seenLines: Map<string, FailureOutcome>,
): Promise<{outcome: FailureOutcome; line?: string}> {
  const {verdict} = item.result
  const base = {source: item.source, signature: item.signature, seam: item.seam, verdict}
  if (verdict === 'error') {
    return {outcome: {...base, action: 'error', reason: `verify failed: ${item.result.summary}`}}
  }
  const kind = issueKind(verdict)
  const knownBug = item.failure?.knownBug
  if (kind === 'engine' && knownBug) {
    return {outcome: {...base, kind, action: 'known-bug', reason: `known bug ${knownBug}`}}
  }
  const line = signatureLine(item, kind)
  if (line === undefined) {
    return {
      outcome: {
        ...base,
        kind,
        action: 'error',
        reason: 'fake-mismatch verdict has no fakeSignature',
      },
    }
  }
  const lineText = signatureLineText(line)
  const earlier = seenLines.get(lineText)
  if (earlier) {
    const reason = duplicateReason(earlier, item)
    return {outcome: {...base, kind, action: 'duplicate', issues: earlier.issues, reason}}
  }
  try {
    const existing = options.linear ? await options.linear.findBySignatureLine(lineText) : []
    if (existing.length > 0) {
      return {outcome: {...base, kind, action: 'duplicate', issues: existing}, line: lineText}
    }
    const issue = await buildIssue(item, line, kind, options.explain)
    if (options.dryRun) {
      const outcome: FailureOutcome = {
        ...base,
        kind,
        action: 'would-file',
        title: issue.title,
        body: issue.description,
      }
      return {outcome, line: lineText}
    }
    const created = await options.linear?.create(issue)
    const issues = created ? [created] : []
    return {outcome: {...base, kind, action: 'filed', title: issue.title, issues}, line: lineText}
  } catch (error) {
    return {outcome: {...base, kind, action: 'error', reason: messageOf(error)}}
  }
}

export async function fileFailures(
  pairs: ReportPair[],
  options: FileOptions,
): Promise<FileSummary> {
  const plans = pairs.map(planPair)
  const items = [
    ...plans.flatMap((plan) => plan.failures),
    ...plans.flatMap((plan) => plan.samples),
  ]
  const seenLines = new Map<string, FailureOutcome>()
  const handled = await items.reduce<Promise<FailureOutcome[]>>(async (previous, item) => {
    const outcomes = await previous
    const {outcome, line} = await handle(item, options, seenLines)
    if (line) seenLines.set(line, outcome)
    outcomes.push(outcome)
    return outcomes
  }, Promise.resolve([]))
  return {
    dryRun: options.dryRun,
    commits: [...new Set(pairs.map((pair) => pair.report.commit))],
    dedupe: options.linear ? 'linear' : 'skipped',
    fidelity: fidelityOf(pairs),
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
  const context = [outcome.source, outcome.seam, outcome.verdict].filter(Boolean).join(', ')
  return `- \`${outcome.signature}\` (${context})${details.length > 0 ? `: ${details.join(', ')}` : ''}`
}

function group(title: string, outcomes: FailureOutcome[]): string[] {
  return outcomes.length === 0 ? [] : [`### ${title}`, '', ...outcomes.map(outcomeLine), '']
}

function plural(count: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${count} ${count === 1 ? noun : pluralNoun}`
}

function fidelityLine(fidelity: FakeFidelity): string {
  if (fidelity.samples === 0) return 'Fake fidelity: no passing samples were replayed.'
  return `Fake fidelity: ${fidelity.matched} of ${plural(fidelity.replayed, 'replayed sample')} matched the real Content Lake (${plural(fidelity.mismatched, 'mismatch', 'mismatches')}, ${plural(fidelity.errors, 'error')}, ${fidelity.nothingToReplay} with nothing to replay, ${plural(fidelity.submissions, 'submission')} replayed).`
}

export function summaryMarkdown(summary: FileSummary): string {
  const byAction = (action: OutcomeAction, kind?: IssueKind) =>
    summary.outcomes.filter(
      (outcome) => outcome.action === action && (kind === undefined || outcome.kind === kind),
    )
  const filedHeading = summary.dryRun ? 'Would file (dry run)' : 'Filed'
  const filedAction: OutcomeAction = summary.dryRun ? 'would-file' : 'filed'
  const dedupeNote = summary.dedupe === 'linear' ? [] : ['Dedupe skipped: no `LINEAR_API_KEY`.', '']
  const failureCount = summary.outcomes.filter((outcome) => outcome.source === 'failure').length
  const lines = [
    `## Sync verification: ${plural(failureCount, 'distinct failure')}`,
    '',
    `Commit ${summary.commits.map((commit) => `\`${commit}\``).join(', ') || 'none'}.`,
    '',
    fidelityLine(summary.fidelity),
    '',
    ...dedupeNote,
    ...group(`${filedHeading}: engine bugs`, byAction(filedAction, 'engine')),
    ...group(`${filedHeading}: fake model differences`, byAction(filedAction, 'fake-model')),
    ...group('Already filed', byAction('duplicate')),
    ...group('Known bugs (not filed)', byAction('known-bug')),
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
