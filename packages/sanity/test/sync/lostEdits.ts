import {isDeepStrictEqual} from 'node:util'

import {type SanityDocument} from '@sanity/types'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {type SubmissionRecord} from './fakeContentLake'
import {type EditRecord} from './syncTest'

type Path = string[]

export interface EditHistory {
  edits: EditRecord[]
  lake: {submissions: SubmissionRecord[]}
}

const PATH_SEGMENT = /[^.[\]]+|\[[^\]]*\]/g
const INDEX_SEGMENT = /^\[-?\d+\]$/
const KEY_SEGMENT = /^\[_key\s*==\s*["'](.*)["']\]$/
// setIfMissing is left out: like createIfNotExists it only ensures a container exists, and as an ancestor path it would carry every edit below it.
const PATH_KEYED_OPERATIONS = ['set', 'diffMatchPatch', 'inc', 'dec'] as const

function parsePath(path: string): Path {
  return path.match(PATH_SEGMENT) ?? []
}

function insertedPaths(insert: Record<string, unknown>): Path[] {
  const target = insert.after ?? insert.before ?? insert.replace
  const items = (insert.items as Array<{_key?: string}> | undefined) ?? []
  return typeof target === 'string'
    ? items.map((item) => [...parsePath(target).slice(0, -1), `[_key=="${item._key}"]`])
    : []
}

function patchPaths(patch: Record<string, unknown>): Path[] {
  const keyed = PATH_KEYED_OPERATIONS.flatMap((operation) =>
    Object.keys((patch[operation] as Record<string, unknown> | undefined) ?? {}).map(parsePath),
  )
  const unset = ((patch.unset as string[] | undefined) ?? []).map(parsePath)
  const inserted = patch.insert ? insertedPaths(patch.insert as Record<string, unknown>) : []
  return [...keyed, ...unset, ...inserted]
}

function targetOf(mutation: MutationPayload): string | undefined {
  if (mutation.patch) return mutation.patch.id
  if (mutation.delete) return mutation.delete.id
  return (mutation.create ?? mutation.createOrReplace)?._id
}

// createIfNotExists only ensures the document exists, so it neither is an edit nor carries one.
function pathsOf(mutations: MutationPayload[], documentId: string): Path[] {
  return mutations.flatMap((mutation) => {
    if (targetOf(mutation) !== documentId) return []
    return mutation.patch ? patchPaths(mutation.patch as Record<string, unknown>) : [[]]
  })
}

function segmentsMatch(left: string, right: string): boolean {
  if (left === right) return true
  const indexed = INDEX_SEGMENT.test(left) || INDEX_SEGMENT.test(right)
  return indexed && left.startsWith('[') && right.startsWith('[')
}

function isSameOrAncestor(candidate: Path, path: Path): boolean {
  return (
    candidate.length <= path.length &&
    candidate.every((segment, index) => segmentsMatch(segment, path[index]))
  )
}

function isSamePath(left: Path, right: Path): boolean {
  return left.length === right.length && isSameOrAncestor(left, right)
}

function touchesPath(mutations: MutationPayload[], documentId: string, path: Path): boolean {
  return pathsOf(mutations, documentId).some((touched) => isSameOrAncestor(touched, path))
}

function step(value: unknown, segment: string): unknown {
  if (value === null || typeof value !== 'object') return undefined
  const key = segment.match(KEY_SEGMENT)?.[1]
  if (key !== undefined && Array.isArray(value)) {
    return value.find((item: {_key?: string}) => item?._key === key)
  }
  if (INDEX_SEGMENT.test(segment) && Array.isArray(value)) {
    return value.at(Number(segment.slice(1, -1)))
  }
  return (value as Record<string, unknown>)[segment]
}

function valueAt(document: SanityDocument | null, path: Path): unknown {
  return path.reduce<unknown>(step, document)
}

function isTerminal(submission: SubmissionRecord): boolean {
  return submission.outcome === 'rejected' && (submission.statusCode ?? 0) < 500
}

function isOrganicRejection(submission: SubmissionRecord): boolean {
  return submission.outcome === 'rejected' && submission.injected === false
}

interface EditContext {
  edit: EditRecord
  path: Path
  ownEdits: EditRecord[]
  ownSubmissions: SubmissionRecord[]
}

function sameCommitWindow(context: EditContext, from: number, to: number): boolean {
  return context.ownSubmissions.every(
    (submission) => submission.submittedAt < from || submission.submittedAt >= to,
  )
}

function carriers(context: EditContext): SubmissionRecord[] {
  const {edit, path, ownSubmissions} = context
  return ownSubmissions.filter(
    (submission) =>
      submission.submittedAt >= edit.at && touchesPath(submission.mutations, edit.documentId, path),
  )
}

function reachedServer(context: EditContext): boolean {
  return carriers(context).some((submission) => submission.outcome === 'accepted')
}

function wasInFlightDuring(submission: SubmissionRecord, at: number): boolean {
  return at > submission.submittedAt && at <= (submission.settledAt ?? -1)
}

// A terminal rejection discards the rejected save and the commits queued behind it, never the unsent buffer.
function discardedOnPurpose(context: EditContext): boolean {
  const sent = carriers(context)
  const discarded = context.ownSubmissions.some(
    (submission) =>
      submission.injected === true &&
      isTerminal(submission) &&
      (sent.includes(submission) || wasInFlightDuring(submission, context.edit.at)),
  )
  return discarded && sent.filter(isOrganicRejection).length === 0
}

function supersededLocally(context: EditContext): boolean {
  const {edit, path, ownEdits} = context
  return ownEdits
    .slice(ownEdits.indexOf(edit) + 1)
    .some(
      (later) =>
        sameCommitWindow(context, edit.at, later.at) &&
        touchesPath(later.mutations, edit.documentId, path),
    )
}

function changedNothing(context: EditContext): boolean {
  const {edit, path, ownEdits} = context
  const runStart = ownEdits
    .slice(0, ownEdits.indexOf(edit) + 1)
    .find(
      (earlier) =>
        sameCommitWindow(context, earlier.at, edit.at) &&
        pathsOf(earlier.mutations, edit.documentId).some((touched) => isSamePath(touched, path)),
    )
  return isDeepStrictEqual(valueAt(runStart?.before ?? null, path), valueAt(edit.after, path))
}

function isLost(context: EditContext): boolean {
  const explanations = [reachedServer, supersededLocally, changedNothing, discardedOnPurpose]
  return explanations.filter((explanation) => explanation(context)).length === 0
}

export interface LostEdit {
  edit: EditRecord
  fate: string
}

function fateOf(context: EditContext): string {
  const sent = carriers(context)
  const rejected = sent.find(isOrganicRejection)
  if (rejected) return `rejected with ${rejected.statusCode} ${rejected.reason}`
  if (sent.some((submission) => submission.outcome === 'pending')) return 'never answered'
  return 'never sent'
}

function lostEditsOf(edit: EditRecord, world: EditHistory): LostEdit[] {
  const ownEdits = world.edits.filter(
    (other) => other.client === edit.client && other.documentId === edit.documentId,
  )
  const ownSubmissions = world.lake.submissions.filter(
    (submission) => submission.clientId === edit.client,
  )
  const [unaccounted] = pathsOf(edit.mutations, edit.documentId)
    .map((path) => ({edit, path, ownEdits, ownSubmissions}))
    .filter(isLost)
  return unaccounted ? [{edit, fate: fateOf(unaccounted)}] : []
}

// An edit is accounted for when it reached the server, was overwritten locally before the next save, changed nothing, or was discarded by an injected 4xx.
export function lostEdits(world: EditHistory): LostEdit[] {
  return world.edits.flatMap((edit) => lostEditsOf(edit, world))
}

export function describeLostEdit({edit}: LostEdit): string {
  const operations = edit.mutations.map((mutation) => {
    if (mutation.patch === undefined) return JSON.stringify(mutation)
    const {id, ...operation} = mutation.patch
    return JSON.stringify(operation)
  })
  return `${edit.client} ${operations.join(', ')} on ${edit.documentId}`
}
