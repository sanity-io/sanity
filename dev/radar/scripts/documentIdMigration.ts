/**
 * Pure half of the id migration (I/O lives in migrateDocumentIds.ts): given a
 * document stored under one of the old camelCase / dotted ids
 * (`gitTag-v6.10.1`, `gitCommit-<sha>`, `benchRun-…`, `bisectSession-<uuid>`,
 * `driftAck-…`), produce the same document under the id
 * `@repo/utils/radar-ids` builds today (`git-tag-v6-10-1`, `git-commit-<sha>`,
 * `bench-run-…`, …), with weak `commit` references repointed at the new commit
 * ids.
 */
import {benchRunId, bisectSessionId, driftAckId, gitCommitId, gitTagId} from '@repo/utils/radar-ids'
import {type SanityDocument} from '@sanity/client'

const FULL_SHA_RE = /^[0-9a-f]{40}$/

/**
 * Legacy id prefix per type — anything starting with one of these moves.
 * Key order is migration order: commits first, so the references the moved
 * tags and runs point at exist by the time anyone follows them.
 */
export const LEGACY_PREFIXES = {
  gitCommit: 'gitCommit-',
  gitTag: 'gitTag-',
  benchRun: 'benchRun-',
  bisectSession: 'bisectSession-',
  driftAck: 'driftAck-',
} as const

export type MigratedType = keyof typeof LEGACY_PREFIXES

export const MIGRATED_TYPES = Object.keys(LEGACY_PREFIXES) as MigratedType[]

export interface Migration {
  legacyId: string
  document: Record<string, unknown> & {_id: string; _type: string}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Weak reference to a commit document, or nothing when the sha is not a full sha (PR-branch runs). */
function commitReference(
  sha: unknown,
): {commit: {_type: 'reference'; _ref: string; _weak: true}} | Record<never, never> {
  return typeof sha === 'string' && FULL_SHA_RE.test(sha)
    ? {commit: {_type: 'reference', _ref: gitCommitId(sha), _weak: true}}
    : {}
}

/**
 * The document as it should exist under its new id, or undefined when the id
 * is not a legacy one or the fields it derives from are missing (left in
 * place, reported). System fields the API owns are dropped; the new copy gets
 * its own `_rev` / `_createdAt` — every type carries its own meaningful
 * timestamp (`startedAt`, `committedAt`, `taggedAt`, `createdAt`, `ackedAt`).
 */
export function migratedDocument(doc: SanityDocument): Migration | undefined {
  const {_rev: _, _createdAt: __, _updatedAt: ___, _id, _type, ...rest} = doc
  if (!MIGRATED_TYPES.includes(_type as MigratedType)) return undefined
  const type = _type as MigratedType
  if (!_id.startsWith(LEGACY_PREFIXES[type])) return undefined

  const move = (newId: string, patch: Record<string, unknown> = {}): Migration => ({
    legacyId: _id,
    document: {...rest, ...patch, _id: newId, _type},
  })

  switch (type) {
    case 'gitCommit':
      return typeof rest.sha === 'string' ? move(gitCommitId(rest.sha)) : undefined
    case 'gitTag':
      return typeof rest.tag === 'string'
        ? move(gitTagId(rest.tag), commitReference(rest.sha))
        : undefined
    case 'benchRun': {
      const git = isRecord(rest.git) ? rest.git : undefined
      const runner = isRecord(rest.runner) ? rest.runner : undefined
      if (!git || typeof git.sha !== 'string' || !runner) return undefined
      // Stored runs carry a weak `git.commit` ref to the legacy commit id;
      // rebuild it from the sha under the same rule storeShape.ts writes with
      // (full sha → reference, which dangles by design for PR-branch commits)
      const {commit: _legacyRef, ...gitRest} = git
      return move(
        benchRunId({
          git: {
            sha: git.sha,
            ...(typeof git.prNumber === 'number' ? {prNumber: git.prNumber} : {}),
          },
          runner: typeof runner.runId === 'string' ? {runId: runner.runId} : {},
        }),
        {git: {...gitRest, ...commitReference(git.sha)}},
      )
    }
    case 'bisectSession':
      return move(bisectSessionId(_id.slice(LEGACY_PREFIXES.bisectSession.length)))
    case 'driftAck':
      return typeof rest.metricKey === 'string' && typeof rest.branch === 'string'
        ? move(driftAckId(rest.metricKey, rest.branch))
        : undefined
    default:
      return undefined
  }
}
