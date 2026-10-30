export type Seam = 'pair' | 'operations'

export interface SignatureFields {
  rule: string
  check?: string
  detail?: string
  fate?: string
  statusCode?: number
  errorType?: string
  operation?: string
  thrownBy?: string
}

export interface GeneratorFailure {
  signature: string
  signatureFields: SignatureFields
  message: string
  seed: number
  definition: Record<string, unknown> & {seam: Seam}
}

export interface GeneratorSample {
  seed: number
  runIndex: number
  definition: Record<string, unknown> & {seam: Seam}
}

export interface GeneratorReport {
  version: 1
  commit: string
  seam: Seam
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

const SEAMS: readonly string[] = ['pair', 'operations']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function headerProblems(value: Record<string, unknown>, listKey: string): string[] {
  return [
    value.version === 1 ? undefined : 'version must be 1',
    typeof value.commit === 'string' && value.commit !== '' ? undefined : 'commit is missing',
    SEAMS.includes(String(value.seam)) ? undefined : `seam must be pair or operations`,
    Array.isArray(value[listKey]) ? undefined : `${listKey} must be an array`,
    value.samples === undefined || Array.isArray(value.samples)
      ? undefined
      : 'samples must be an array when present',
  ].filter((problem): problem is string => problem !== undefined)
}

type FieldCheck = [isValid: boolean, problem: string]

function problemsOf(
  item: unknown,
  label: string,
  checks: (record: Record<string, unknown>) => FieldCheck[],
): string[] {
  if (isRecord(item)) {
    return checks(item).flatMap(([isValid, problem]) => (isValid ? [] : [`${label}.${problem}`]))
  }
  return [`${label} is not an object`]
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value !== ''
}

function failureChecks(failure: Record<string, unknown>): FieldCheck[] {
  return [
    [isNonEmptyString(failure.signature), 'signature is missing'],
    [
      isRecord(failure.signatureFields) && typeof failure.signatureFields.rule === 'string',
      'signatureFields.rule is missing',
    ],
    [typeof failure.message === 'string', 'message is missing'],
    [typeof failure.seed === 'number', 'seed is missing'],
    [isRecord(failure.definition), 'definition is missing'],
  ]
}

function sampleChecks(sample: Record<string, unknown>): FieldCheck[] {
  return [
    [typeof sample.seed === 'number', 'seed is missing'],
    [typeof sample.runIndex === 'number', 'runIndex is missing'],
    [isRecord(sample.definition), 'definition is missing'],
  ]
}

function outcomeChecks(verdict: Record<string, unknown>, allowed: readonly string[]): FieldCheck[] {
  return [
    [allowed.includes(String(verdict.verdict)), `verdict must be one of ${allowed.join(', ')}`],
    [
      verdict.fakeSignature === undefined || isNonEmptyString(verdict.fakeSignature),
      'fakeSignature must be a non-empty string when present',
    ],
    [typeof verdict.summary === 'string', 'summary is missing'],
    [Array.isArray(verdict.differences), 'differences must be an array'],
  ]
}

function verdictChecks(verdict: Record<string, unknown>): FieldCheck[] {
  return [
    [isNonEmptyString(verdict.signature), 'signature is missing'],
    ...outcomeChecks(verdict, VERDICTS),
  ]
}

function sampleVerdictChecks(verdict: Record<string, unknown>): FieldCheck[] {
  return [
    [typeof verdict.seed === 'number', 'seed is missing'],
    [typeof verdict.runIndex === 'number', 'runIndex is missing'],
    ...outcomeChecks(verdict, SAMPLE_VERDICTS),
  ]
}

function listProblems(
  value: Record<string, unknown>,
  key: string,
  checks: (record: Record<string, unknown>) => FieldCheck[],
): string[] {
  const items = Array.isArray(value[key]) ? (value[key] as unknown[]) : []
  return items.flatMap((item, index) => problemsOf(item, `${key}[${index}]`, checks))
}

function parseWith<T>(
  rawText: string,
  label: string,
  listKey: string,
  checks: (record: Record<string, unknown>) => FieldCheck[],
  sampleListChecks: (record: Record<string, unknown>) => FieldCheck[],
): T {
  const parsed: unknown = JSON.parse(rawText)
  const value = isRecord(parsed) ? parsed : {}
  const problems = [
    ...headerProblems(value, listKey),
    ...listProblems(value, listKey, checks),
    ...listProblems(value, 'samples', sampleListChecks),
  ]
  if (problems.length > 0) throw new Error(`Invalid ${label}:\n${problems.join('\n')}`)
  return value as T
}

export function parseGeneratorReport(rawText: string): GeneratorReport {
  return parseWith<GeneratorReport>(
    rawText,
    'generator report',
    'failures',
    failureChecks,
    sampleChecks,
  )
}

export function parseVerdictsFile(rawText: string): VerdictsFile {
  return parseWith<VerdictsFile>(
    rawText,
    'verdicts file',
    'verdicts',
    verdictChecks,
    sampleVerdictChecks,
  )
}
