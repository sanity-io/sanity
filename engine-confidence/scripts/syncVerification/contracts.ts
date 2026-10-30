export type Seam = 'pair' | 'operations'

export interface SignatureFields {
  rule: string
  check?: string
  fate?: string
  statusCode?: number
  errorType?: string
  operation?: string
}

export interface GeneratorFailure {
  signature: string
  signatureFields: SignatureFields
  message: string
  seed: number
  definition: Record<string, unknown> & {seam: Seam}
}

export interface GeneratorReport {
  version: 1
  commit: string
  seam: Seam
  failures: GeneratorFailure[]
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
  summary: string
  differences: VerdictDifference[]
  replayed: number
}

export interface VerdictsFile {
  version: 1
  commit: string
  seam: Seam
  verdicts: FailureVerdict[]
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
  ].filter((problem): problem is string => problem !== undefined)
}

function failureProblems(failure: unknown, index: number): string[] {
  if (isRecord(failure)) return failureFieldProblems(failure, index)
  return [`failures[${index}] is not an object`]
}

function failureFieldProblems(failure: Record<string, unknown>, index: number): string[] {
  return [
    typeof failure.signature === 'string' && failure.signature !== ''
      ? undefined
      : `failures[${index}].signature is missing`,
    isRecord(failure.signatureFields) && typeof failure.signatureFields.rule === 'string'
      ? undefined
      : `failures[${index}].signatureFields.rule is missing`,
    typeof failure.message === 'string' ? undefined : `failures[${index}].message is missing`,
    typeof failure.seed === 'number' ? undefined : `failures[${index}].seed is missing`,
    isRecord(failure.definition) ? undefined : `failures[${index}].definition is missing`,
  ].filter((problem): problem is string => problem !== undefined)
}

function verdictProblems(verdict: unknown, index: number): string[] {
  if (isRecord(verdict)) return verdictFieldProblems(verdict, index)
  return [`verdicts[${index}] is not an object`]
}

function verdictFieldProblems(verdict: Record<string, unknown>, index: number): string[] {
  return [
    typeof verdict.signature === 'string' && verdict.signature !== ''
      ? undefined
      : `verdicts[${index}].signature is missing`,
    (VERDICTS as readonly unknown[]).includes(verdict.verdict)
      ? undefined
      : `verdicts[${index}].verdict must be one of ${VERDICTS.join(', ')}`,
    typeof verdict.summary === 'string' ? undefined : `verdicts[${index}].summary is missing`,
    Array.isArray(verdict.differences)
      ? undefined
      : `verdicts[${index}].differences must be an array`,
  ].filter((problem): problem is string => problem !== undefined)
}

function parseWith<T>(
  rawText: string,
  label: string,
  listKey: string,
  itemProblems: (item: unknown, index: number) => string[],
): T {
  const parsed: unknown = JSON.parse(rawText)
  const value = isRecord(parsed) ? parsed : {}
  const header = headerProblems(value, listKey)
  const items = Array.isArray(value[listKey]) ? (value[listKey] as unknown[]) : []
  const problems = [...header, ...items.flatMap(itemProblems)]
  if (problems.length > 0) throw new Error(`Invalid ${label}:\n${problems.join('\n')}`)
  return value as T
}

export function parseGeneratorReport(rawText: string): GeneratorReport {
  return parseWith<GeneratorReport>(rawText, 'generator report', 'failures', failureProblems)
}

export function parseVerdictsFile(rawText: string): VerdictsFile {
  return parseWith<VerdictsFile>(rawText, 'verdicts file', 'verdicts', verdictProblems)
}
