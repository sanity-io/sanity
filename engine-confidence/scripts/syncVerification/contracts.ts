import {type ContentLakeDocument} from '@repo/content-lake-model'

export type Seam = 'pair' | 'operations'

export type SubmissionRequest =
  | {kind: 'actions'; actions: unknown[]}
  | {kind: 'mutations'; mutations: unknown[]}
  | {kind: 'outside'; mutations: unknown[]}

export interface SubmissionReport {
  clientId: string
  transactionId: string
  request: SubmissionRequest
  injected: boolean
  outcome: 'accepted' | 'rejected' | 'pending'
  statusCode?: number
  responseBody?: unknown
  settledAt?: number
}

export interface SyncTestStep {
  do: string
  client?: string
  order?: 'fifo' | 'reverse'
  [key: string]: unknown
}

export interface SyncTestDefinition {
  id: string
  title: string
  seam: Seam
  initial: ContentLakeDocument[]
  idPair: {publishedId: string; draftId: string; versionId?: string}
  clients: string[]
  steps: SyncTestStep[]
}

export interface ReplayableSequence {
  definition: SyncTestDefinition
  initial: ContentLakeDocument[]
  submissions: SubmissionReport[]
}

export type SignatureRule =
  | 'converged'
  | 'revisions'
  | 'healthy'
  | 'keys'
  | 'lost-edits'
  | 'unhandled-rejections'
  | 'settle'
  | 'step'

export interface SignatureFields {
  rule: SignatureRule
  check?: string
  detail?: string
  fate?: 'rejected' | 'never-sent' | 'never-answered'
  statusCode?: number
  errorType?: string
  operation?: string
  thrownBy?: string
}

export interface GeneratorFailure extends ReplayableSequence {
  signature: string
  signatureFields: SignatureFields
  message: string
  seed: number
}

export interface GeneratorSample extends ReplayableSequence {
  seed: number
  runIndex: number
}

export interface GeneratorReport {
  version: 1
  commit: string
  seam: Seam
  seeds: number[]
  runsPerSeed: number
  maxSteps: number
  failures: GeneratorFailure[]
  samples?: GeneratorSample[]
}

export const VERDICTS = ['confirmed', 'fake-mismatch', 'assumed', 'error'] as const
export type Verdict = (typeof VERDICTS)[number]

export interface VerdictDifference {
  submission: number
  transactionId: string
  field: 'statusCode' | 'errorType' | 'document'
  documentId?: string
  fake: unknown
  real: unknown
}

export interface FailureVerdict {
  signature: string
  verdict: Verdict
  fakeSignature?: string
  summary: string
  differences: VerdictDifference[]
  replayed: number
}

export const SAMPLE_VERDICTS = ['confirmed', 'fake-mismatch', 'error'] as const
export type SampleVerdictValue = (typeof SAMPLE_VERDICTS)[number]

export interface SampleVerdict {
  seed: number
  runIndex: number
  verdict: SampleVerdictValue
  fakeSignature?: string
  summary: string
  differences: VerdictDifference[]
  replayed: number
}

export interface VerdictsFile {
  version: 1
  commit: string
  seam: Seam
  verdicts: FailureVerdict[]
  samples?: SampleVerdict[]
}

const SEAMS = new Set<unknown>(['pair', 'operations'])
const REQUEST_KINDS = new Set<unknown>(['actions', 'mutations', 'outside'])
const OUTCOMES = new Set<unknown>(['accepted', 'rejected', 'pending'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value !== ''
}

type FieldCheck = [isValid: boolean, problem: string]

function failedChecks(checks: FieldCheck[], where: string): string[] {
  return checks.flatMap(([isValid, problem]) => (isValid ? [] : [`${where}.${problem}`]))
}

function requestProblems(request: unknown, where: string): string[] {
  if (isRecord(request) && REQUEST_KINDS.has(request.kind)) {
    const listKey = request.kind === 'actions' ? 'actions' : 'mutations'
    return Array.isArray(request[listKey]) ? [] : [`${where}.request.${listKey} must be an array`]
  }
  return [`${where}.request.kind must be one of actions, mutations, outside`]
}

function submissionProblems(submission: unknown, where: string): string[] {
  if (isRecord(submission)) {
    return [
      ...failedChecks(
        [
          [typeof submission.transactionId === 'string', 'transactionId must be a string'],
          [typeof submission.injected === 'boolean', 'injected must be a boolean'],
          [OUTCOMES.has(submission.outcome), 'outcome must be one of accepted, rejected, pending'],
        ],
        where,
      ),
      ...requestProblems(submission.request, where),
    ]
  }
  return [`${where} must be an object`]
}

function documentProblems(document: unknown, where: string): string[] {
  return isRecord(document) &&
    typeof document._id === 'string' &&
    typeof document._type === 'string'
    ? []
    : [`${where} must be a document with string _id and _type`]
}

function sequenceProblems(sequence: Record<string, unknown>, where: string): string[] {
  const definition = sequence.definition
  return [
    ...(isRecord(definition) && Array.isArray(definition.steps)
      ? []
      : [`${where}.definition.steps must be an array`]),
    ...(Array.isArray(sequence.initial)
      ? sequence.initial.flatMap((document, position) =>
          documentProblems(document, `${where}.initial[${position}]`),
        )
      : [`${where}.initial must be an array`]),
    ...(Array.isArray(sequence.submissions)
      ? sequence.submissions.flatMap((submission, position) =>
          submissionProblems(submission, `${where}.submissions[${position}]`),
        )
      : [`${where}.submissions must be an array`]),
  ]
}

function failureProblems(failure: unknown, index: number): string[] {
  const where = `failures[${index}]`
  if (isRecord(failure)) {
    return [
      ...failedChecks(
        [
          [isNonEmptyString(failure.signature), 'signature must be a non-empty string'],
          [
            isRecord(failure.signatureFields) && typeof failure.signatureFields.rule === 'string',
            'signatureFields.rule is missing',
          ],
          [typeof failure.message === 'string', 'message must be a string'],
          [typeof failure.seed === 'number', 'seed must be a number'],
        ],
        where,
      ),
      ...sequenceProblems(failure, where),
    ]
  }
  return [`${where} must be an object`]
}

function sampleProblems(sample: unknown, index: number): string[] {
  const where = `samples[${index}]`
  if (isRecord(sample)) {
    return [
      ...failedChecks(
        [
          [typeof sample.seed === 'number', 'seed must be a number'],
          [typeof sample.runIndex === 'number', 'runIndex must be a number'],
        ],
        where,
      ),
      ...sequenceProblems(sample, where),
    ]
  }
  return [`${where} must be an object`]
}

function optionalListProblems(
  list: unknown,
  label: string,
  problemsOf: (item: unknown, index: number) => string[],
): string[] {
  if (list === undefined) return []
  return Array.isArray(list) ? list.flatMap(problemsOf) : [`${label} must be an array`]
}

function headerProblems(value: Record<string, unknown>): string[] {
  return [
    ...(value.version === 1 ? [] : ['version must be 1']),
    ...(isNonEmptyString(value.commit) ? [] : ['commit must be a non-empty string']),
    ...(SEAMS.has(value.seam) ? [] : ['seam must be pair or operations']),
  ]
}

export function generatorReportProblems(report: unknown): string[] {
  if (isRecord(report)) {
    return [
      ...headerProblems(report),
      ...(Array.isArray(report.failures)
        ? report.failures.flatMap(failureProblems)
        : ['failures must be an array']),
      ...optionalListProblems(report.samples, 'samples', sampleProblems),
    ]
  }
  return ['report must be a JSON object']
}

function verdictOutcomeChecks(
  verdict: Record<string, unknown>,
  allowed: readonly string[],
): FieldCheck[] {
  return [
    [allowed.includes(String(verdict.verdict)), `verdict must be one of ${allowed.join(', ')}`],
    [
      verdict.fakeSignature === undefined || isNonEmptyString(verdict.fakeSignature),
      'fakeSignature must be a non-empty string when present',
    ],
    [typeof verdict.summary === 'string', 'summary must be a string'],
    [Array.isArray(verdict.differences), 'differences must be an array'],
  ]
}

function failureVerdictProblems(verdict: unknown, index: number): string[] {
  const where = `verdicts[${index}]`
  if (isRecord(verdict)) {
    return failedChecks(
      [
        [isNonEmptyString(verdict.signature), 'signature must be a non-empty string'],
        ...verdictOutcomeChecks(verdict, VERDICTS),
      ],
      where,
    )
  }
  return [`${where} must be an object`]
}

function sampleVerdictProblems(verdict: unknown, index: number): string[] {
  const where = `samples[${index}]`
  if (isRecord(verdict)) {
    return failedChecks(
      [
        [typeof verdict.seed === 'number', 'seed must be a number'],
        [typeof verdict.runIndex === 'number', 'runIndex must be a number'],
        ...verdictOutcomeChecks(verdict, SAMPLE_VERDICTS),
      ],
      where,
    )
  }
  return [`${where} must be an object`]
}

export function verdictsFileProblems(verdicts: unknown): string[] {
  if (isRecord(verdicts)) {
    return [
      ...headerProblems(verdicts),
      ...(Array.isArray(verdicts.verdicts)
        ? verdicts.verdicts.flatMap(failureVerdictProblems)
        : ['verdicts must be an array']),
      ...optionalListProblems(verdicts.samples, 'samples', sampleVerdictProblems),
    ]
  }
  return ['verdicts file must be a JSON object']
}

function parseWith<T>(rawText: string, label: string, problemsOf: (value: unknown) => string[]): T {
  const parsed: unknown = JSON.parse(rawText)
  const problems = problemsOf(parsed)
  if (problems.length > 0) throw new Error(`Invalid ${label}:\n${problems.join('\n')}`)
  return parsed as T
}

export function parseGeneratorReport(rawText: string): GeneratorReport {
  return parseWith(rawText, 'generator report', generatorReportProblems)
}

export function parseVerdictsFile(rawText: string): VerdictsFile {
  return parseWith(rawText, 'verdicts file', verdictsFileProblems)
}
