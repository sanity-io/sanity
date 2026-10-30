import {type ContentLakeDocument} from '@repo/content-lake-model'

import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorSample,
  type ReplayableSequence,
  type SampleVerdict,
  type VerdictDifference,
} from './contracts'
import {fakeSignatureOf} from './fakeSignature'
import {type ReplayEntry, type SubmissionOutcome} from './modelReplay'

export type ComparableDocument = Omit<ContentLakeDocument, '_rev' | '_updatedAt' | '_createdAt'>

export interface SubmissionComparison {
  submission: number
  transactionId: string
  recorded: SubmissionOutcome
  fake: SubmissionOutcome
  real: SubmissionOutcome
  fakeDocuments: Record<string, ComparableDocument | null>
  realDocuments: Record<string, ComparableDocument | null>
}

export interface SequenceReplay {
  plan: ReplayEntry[]
  comparisons: SubmissionComparison[]
  unverifiableSteps: string[]
}

interface Assessment {
  divergent?: SubmissionComparison
  differences: VerdictDifference[]
  fakeSignature?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .toSorted()
        .map((key) => [key, canonical(value[key])]),
    )
  }
  return value
}

export function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right))
}

export function comparableDocument(
  document: ContentLakeDocument | null,
): ComparableDocument | null {
  if (document === null) return null
  const {_rev, _updatedAt, _createdAt, ...content} = document
  return canonical(content) as ComparableDocument
}

export function describeOutcome(outcome: SubmissionOutcome): string {
  return outcome.errorType === undefined
    ? String(outcome.statusCode)
    : `${outcome.statusCode} ${outcome.errorType}`
}

function outcomeDiffers(expected: SubmissionOutcome, actual: SubmissionOutcome): boolean {
  if (expected.statusCode !== actual.statusCode) return true
  return expected.errorType !== undefined && expected.errorType !== actual.errorType
}

export function comparisonDifferences(comparison: SubmissionComparison): VerdictDifference[] {
  const {submission, transactionId, fake, real} = comparison
  const base = {submission, transactionId}
  const statusCode: VerdictDifference[] =
    fake.statusCode === real.statusCode
      ? []
      : [{...base, field: 'statusCode', fake: fake.statusCode, real: real.statusCode}]
  const errorType: VerdictDifference[] =
    fake.errorType === real.errorType
      ? []
      : [{...base, field: 'errorType', fake: fake.errorType ?? null, real: real.errorType ?? null}]
  const documentIds = [
    ...new Set([
      ...Object.keys(comparison.fakeDocuments),
      ...Object.keys(comparison.realDocuments),
    ]),
  ].toSorted()
  const documents = documentIds.flatMap((documentId): VerdictDifference[] => {
    const fakeDocument = comparison.fakeDocuments[documentId] ?? null
    const realDocument = comparison.realDocuments[documentId] ?? null
    if (sameValue(fakeDocument, realDocument)) return []
    return [{...base, field: 'document', documentId, fake: fakeDocument, real: realDocument}]
  })
  return [...statusCode, ...errorType, ...documents]
}

const LISTENER_FAULTS: Record<string, string> = {
  dropEvent: 'a dropped listener event',
  disconnect: 'a listener disconnect',
  reconnect: 'a listener reconnect',
}

export function unverifiableStepsOf(sequence: ReplayableSequence): string[] {
  const listenerFaults = sequence.definition.steps.flatMap((step) => {
    if (step.do === 'releaseEvents' && step.order === 'reverse') {
      return ['listener events delivered out of order']
    }
    const fault = LISTENER_FAULTS[step.do]
    return fault === undefined ? [] : [fault]
  })
  const injected = sequence.submissions
    .filter((submission) => submission.injected)
    .map((submission) => `an injected ${submission.statusCode ?? 'unknown'} rejection`)
  return [...new Set([...listenerFaults, ...injected])]
}

function listInWords(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function describeDifference(difference: VerdictDifference): string {
  const where = `submission ${difference.submission}`
  if (difference.field === 'document') {
    return `${where} left ${difference.documentId} different from the fake`
  }
  if (difference.field === 'statusCode') {
    return `${where} answered ${String(difference.real)} where the fake answered ${String(difference.fake)}`
  }
  return `${where} answered error type ${String(difference.real)} where the fake answered ${String(difference.fake)}`
}

function assess(sequence: ReplayableSequence, replay: SequenceReplay): Assessment {
  const divergent = replay.comparisons.find((comparison) =>
    outcomeDiffers(comparison.recorded, comparison.fake),
  )
  if (divergent) return {divergent, differences: []}
  const differences = replay.comparisons.flatMap(comparisonDifferences)
  if (differences.length === 0) return {differences}
  const firstDisagreement = replay.comparisons.find(
    (comparison) => comparison.submission === differences[0].submission,
  )
  return {
    differences,
    fakeSignature: firstDisagreement && fakeSignatureOf(sequence.submissions, firstDisagreement),
  }
}

function divergenceSummary(divergent: SubmissionComparison): string {
  return `Replaying the report in submission order through the fake model did not reproduce the generator's recorded outcome for submission ${divergent.submission} (recorded ${describeOutcome(divergent.recorded)}, replayed ${describeOutcome(divergent.fake)}), so the real Content Lake comparison is not meaningful.`
}

function mismatchSummary(replay: SequenceReplay, differences: VerdictDifference[]): string {
  const disagreeing = new Set(differences.map((difference) => difference.submission)).size
  return `The real Content Lake disagreed with the fake on ${disagreeing} of ${plural(replay.comparisons.length, 'replayed submission')}: ${describeDifference(differences[0])}.`
}

function nothingReplayedSummary(replay: SequenceReplay, subject: string): string {
  if (replay.plan.length === 0) {
    return `The ${subject} sent nothing to the Content Lake, so there is nothing to verify against the real server.`
  }
  return 'Nothing was replayed against the real Content Lake: every submission was either injected by the test or never answered by the fake.'
}

function agreementSummary(replay: SequenceReplay): string {
  const rejected = replay.comparisons.filter((comparison) => comparison.real.statusCode !== 200)
  const total = replay.comparisons.length
  const every = total === 1 ? 'the 1 replayed submission' : `all ${total} replayed submissions`
  if (rejected.length === 0) {
    return `The real Content Lake accepted ${every} and left the same documents as the fake.`
  }
  const answers = listInWords(
    rejected.map(
      (comparison) => `${describeOutcome(comparison.real)} for submission ${comparison.submission}`,
    ),
  )
  return `The real Content Lake answered ${answers}, as the fake did, and matched the fake's documents after ${every}.`
}

export function classifyFailure(failure: GeneratorFailure, replay: SequenceReplay): FailureVerdict {
  const base = {signature: failure.signature, replayed: replay.comparisons.length}
  const {divergent, differences, fakeSignature} = assess(failure, replay)
  if (divergent) {
    return {...base, verdict: 'error', summary: divergenceSummary(divergent), differences: []}
  }
  if (fakeSignature) {
    return {
      ...base,
      verdict: 'fake-mismatch',
      fakeSignature,
      summary: mismatchSummary(replay, differences),
      differences,
    }
  }
  if (replay.comparisons.length === 0) {
    return {
      ...base,
      verdict: 'assumed',
      summary: nothingReplayedSummary(replay, 'failure'),
      differences: [],
    }
  }
  if (replay.unverifiableSteps.length > 0) {
    return {
      ...base,
      verdict: 'assumed',
      summary: `${agreementSummary(replay)} The failure also depends on ${listInWords(replay.unverifiableSteps)}, which the real server cannot be made to reproduce.`,
      differences: [],
    }
  }
  return {...base, verdict: 'confirmed', summary: agreementSummary(replay), differences: []}
}

export function classifySample(sample: GeneratorSample, replay: SequenceReplay): SampleVerdict {
  const base = {seed: sample.seed, runIndex: sample.runIndex, replayed: replay.comparisons.length}
  const {divergent, differences, fakeSignature} = assess(sample, replay)
  if (divergent) {
    return {...base, verdict: 'error', summary: divergenceSummary(divergent), differences: []}
  }
  if (fakeSignature) {
    return {
      ...base,
      verdict: 'fake-mismatch',
      fakeSignature,
      summary: mismatchSummary(replay, differences),
      differences,
    }
  }
  const summary =
    replay.comparisons.length === 0
      ? nothingReplayedSummary(replay, 'sample')
      : agreementSummary(replay)
  return {...base, verdict: 'confirmed', summary, differences: []}
}

function errorSummary(subject: string, reason: string): string {
  return `The verify step could not finish for this ${subject}: ${reason}`
}

export function errorVerdict(signature: string, reason: string, replayed: number): FailureVerdict {
  return {
    signature,
    verdict: 'error',
    summary: errorSummary('failure', reason),
    differences: [],
    replayed,
  }
}

export function sampleErrorVerdict(
  sample: GeneratorSample,
  reason: string,
  replayed: number,
): SampleVerdict {
  return {
    seed: sample.seed,
    runIndex: sample.runIndex,
    verdict: 'error',
    summary: errorSummary('sample', reason),
    differences: [],
    replayed,
  }
}
