import {
  actionsToMutations,
  commitTransaction,
  type ContentLakeAction,
  type ContentLakeDocument,
  ContentLakeError,
  type DocumentIndex,
  type MutationPayload,
} from '@repo/content-lake-model'

import {
  type GeneratorFailure,
  type SubmissionReport,
  type SubmissionRequest,
} from './generatorReport'

export interface SubmissionOutcome {
  statusCode: number
  errorType?: string
}

export type ReplayEntry =
  | {submission: number; transactionId: string; replay: true}
  | {submission: number; transactionId: string; replay: false; reason: 'injected' | 'pending'}

export interface ModelStep {
  submission: number
  transactionId: string
  outcome: SubmissionOutcome
  documents: Record<string, ContentLakeDocument | null>
}

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z'
export const SEED_REVISION = 'seed'
export const ACCEPTED: SubmissionOutcome = {statusCode: 200}

export function replayPlan(failure: GeneratorFailure): ReplayEntry[] {
  return failure.submissions.map((submission, index): ReplayEntry => {
    const base = {submission: index, transactionId: submission.transactionId}
    if (submission.injected) return {...base, replay: false, reason: 'injected'}
    if (submission.outcome === 'pending') return {...base, replay: false, reason: 'pending'}
    return {...base, replay: true}
  })
}

export function errorTypeOf(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const {error, type} = body as {error?: {type?: unknown}; type?: unknown}
  const nested = error?.type
  if (typeof nested === 'string') return nested
  return typeof type === 'string' ? type : undefined
}

export function recordedOutcome(submission: SubmissionReport): SubmissionOutcome {
  if (submission.outcome === 'accepted') return ACCEPTED
  const errorType = errorTypeOf(submission.responseBody)
  return {
    statusCode: submission.statusCode ?? 0,
    ...(errorType === undefined ? {} : {errorType}),
  }
}

export function seedRevisionOf(document: ContentLakeDocument): string {
  return document._rev ?? SEED_REVISION
}

export function seedIndex(initial: ContentLakeDocument[]): DocumentIndex {
  return Object.fromEntries(
    initial.map((document) => [
      document._id,
      {
        ...document,
        _createdAt: document._createdAt ?? SEED_TIMESTAMP,
        _updatedAt: document._updatedAt ?? SEED_TIMESTAMP,
        _rev: seedRevisionOf(document),
      },
    ]),
  )
}

function asContentLakeError(error: unknown): ContentLakeError {
  if (error instanceof ContentLakeError) return error
  return new ContentLakeError(400, {type: 'mutationError', description: String(error), items: []})
}

function mutationsOf(index: DocumentIndex, request: SubmissionRequest): MutationPayload[] {
  if (request.kind === 'actions') {
    return actionsToMutations(index, request.actions as ContentLakeAction[])
  }
  return request.mutations as MutationPayload[]
}

function commitOnModel(
  index: DocumentIndex,
  request: SubmissionRequest,
  transactionId: string,
): {index: DocumentIndex; outcome: SubmissionOutcome} {
  try {
    const committed = commitTransaction({
      index,
      mutations: mutationsOf(index, request),
      transactionId,
      identity: 'sync-verify',
      timestamp: SEED_TIMESTAMP,
    })
    return {index: committed.index, outcome: ACCEPTED}
  } catch (error) {
    const failure = asContentLakeError(error)
    return {index, outcome: {statusCode: failure.statusCode, errorType: failure.body.type}}
  }
}

function documentsOf(
  index: DocumentIndex,
  documentIds: string[],
): Record<string, ContentLakeDocument | null> {
  return Object.fromEntries(documentIds.map((id) => [id, index[id] ?? null]))
}

/** Replays the replayable submissions in report order through the same model the fake uses. */
export function replayOnModel(failure: GeneratorFailure, documentIds: string[]): ModelStep[] {
  const replayable = replayPlan(failure).filter((entry) => entry.replay)
  return replayable.reduce<{index: DocumentIndex; steps: ModelStep[]}>(
    ({index, steps}, entry) => {
      const submission = failure.submissions[entry.submission]
      const committed = commitOnModel(index, submission.request, submission.transactionId)
      const step: ModelStep = {
        submission: entry.submission,
        transactionId: entry.transactionId,
        outcome: committed.outcome,
        documents: documentsOf(committed.index, documentIds),
      }
      return {index: committed.index, steps: [...steps, step]}
    },
    {index: seedIndex(failure.initial), steps: []},
  ).steps
}
