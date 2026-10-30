import {type ContentLakeDocument} from '@repo/content-lake-model'

import {type GeneratorFailure} from './generatorReport'
import {type ReplayEntry, type SubmissionOutcome} from './modelReplay'
import {type FailureVerdict, type VerdictDifference} from './verdicts'

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

export interface FailureReplay {
  signature: string
  plan: ReplayEntry[]
  comparisons: SubmissionComparison[]
  unverifiableSteps: string[]
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

export function unverifiableStepsOf(failure: GeneratorFailure): string[] {
  const listenerFaults = failure.definition.steps.flatMap((step) => {
    if (step.do === 'releaseEvents' && step.order === 'reverse') {
      return ['listener events delivered out of order']
    }
    const fault = LISTENER_FAULTS[step.do]
    return fault === undefined ? [] : [fault]
  })
  const injected = failure.submissions
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

function divergenceVerdict(replay: FailureReplay, divergent: SubmissionComparison): FailureVerdict {
  return {
    signature: replay.signature,
    verdict: 'error',
    summary: `Replaying the report in submission order through the fake model did not reproduce the generator's recorded outcome for submission ${divergent.submission} (recorded ${describeOutcome(divergent.recorded)}, replayed ${describeOutcome(divergent.fake)}), so the real Content Lake comparison is not meaningful.`,
    differences: [],
    replayed: replay.comparisons.length,
  }
}

function mismatchVerdict(replay: FailureReplay, differences: VerdictDifference[]): FailureVerdict {
  const disagreeing = new Set(differences.map((difference) => difference.submission)).size
  return {
    signature: replay.signature,
    verdict: 'fake-mismatch',
    summary: `The real Content Lake disagreed with the fake on ${disagreeing} of ${plural(replay.comparisons.length, 'replayed submission')}: ${describeDifference(differences[0])}.`,
    differences,
    replayed: replay.comparisons.length,
  }
}

function nothingReplayedSummary(replay: FailureReplay): string {
  if (replay.plan.length === 0) {
    return 'The failure sent nothing to the Content Lake, so there is nothing to verify against the real server.'
  }
  return 'Nothing was replayed against the real Content Lake: every submission was either injected by the test or never answered by the fake.'
}

function agreementSummary(replay: FailureReplay): string {
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

export function classifyFailure(replay: FailureReplay): FailureVerdict {
  const divergent = replay.comparisons.find((comparison) =>
    outcomeDiffers(comparison.recorded, comparison.fake),
  )
  if (divergent) return divergenceVerdict(replay, divergent)

  const differences = replay.comparisons.flatMap(comparisonDifferences)
  if (differences.length > 0) return mismatchVerdict(replay, differences)

  const base = {signature: replay.signature, differences: [], replayed: replay.comparisons.length}
  if (replay.comparisons.length === 0) {
    return {...base, verdict: 'assumed', summary: nothingReplayedSummary(replay)}
  }
  if (replay.unverifiableSteps.length > 0) {
    return {
      ...base,
      verdict: 'assumed',
      summary: `${agreementSummary(replay)} The failure also depends on ${listInWords(replay.unverifiableSteps)}, which the real server cannot be made to reproduce.`,
    }
  }
  return {...base, verdict: 'confirmed', summary: agreementSummary(replay)}
}

export function errorVerdict(signature: string, reason: string, replayed: number): FailureVerdict {
  return {
    signature,
    verdict: 'error',
    summary: `The verify step could not finish for this failure: ${reason}`,
    differences: [],
    replayed,
  }
}
