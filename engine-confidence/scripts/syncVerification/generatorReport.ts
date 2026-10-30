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

export interface GeneratorFailure {
  signature: string
  signatureFields: {
    rule: string
    fate?: string
    statusCode?: number
    errorType?: string
    operation?: string
  }
  message: string
  seed: number
  definition: SyncTestDefinition
  initial: ContentLakeDocument[]
  submissions: SubmissionReport[]
}

export interface GeneratorReport {
  version: 1
  commit: string
  seam: Seam
  seeds: number[]
  runsPerSeed: number
  maxSteps: number
  failures: GeneratorFailure[]
}

const SEAMS = new Set<unknown>(['pair', 'operations'])
const REQUEST_KINDS = new Set<unknown>(['actions', 'mutations', 'outside'])
const OUTCOMES = new Set<unknown>(['accepted', 'rejected', 'pending'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
      ...(typeof submission.transactionId === 'string'
        ? []
        : [`${where}.transactionId must be a string`]),
      ...(typeof submission.injected === 'boolean' ? [] : [`${where}.injected must be a boolean`]),
      ...(OUTCOMES.has(submission.outcome)
        ? []
        : [`${where}.outcome must be one of accepted, rejected, pending`]),
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

function failureProblems(failure: unknown, index: number): string[] {
  const where = `failures[${index}]`
  if (isRecord(failure)) {
    const definition = failure.definition
    return [
      ...(typeof failure.signature === 'string' && failure.signature.length > 0
        ? []
        : [`${where}.signature must be a non-empty string`]),
      ...(isRecord(definition) && Array.isArray(definition.steps)
        ? []
        : [`${where}.definition.steps must be an array`]),
      ...(Array.isArray(failure.initial)
        ? failure.initial.flatMap((document, position) =>
            documentProblems(document, `${where}.initial[${position}]`),
          )
        : [`${where}.initial must be an array`]),
      ...(Array.isArray(failure.submissions)
        ? failure.submissions.flatMap((submission, position) =>
            submissionProblems(submission, `${where}.submissions[${position}]`),
          )
        : [`${where}.submissions must be an array`]),
    ]
  }
  return [`${where} must be an object`]
}

export function generatorReportProblems(report: unknown): string[] {
  if (isRecord(report)) {
    return [
      ...(report.version === 1 ? [] : ['version must be 1']),
      ...(typeof report.commit === 'string' ? [] : ['commit must be a string']),
      ...(SEAMS.has(report.seam) ? [] : ['seam must be pair or operations']),
      ...(Array.isArray(report.failures)
        ? report.failures.flatMap(failureProblems)
        : ['failures must be an array']),
    ]
  }
  return ['report must be a JSON object']
}

export function parseGeneratorReport(rawText: string): GeneratorReport {
  const report: unknown = JSON.parse(rawText)
  const problems = generatorReportProblems(report)
  if (problems.length > 0) {
    throw new Error(`Invalid generator report:\n${problems.join('\n')}`)
  }
  return report as GeneratorReport
}
