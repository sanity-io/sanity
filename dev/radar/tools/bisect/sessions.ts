import {bisectSessionId} from '@repo/utils/radar-ids'
import {type Patch} from '@sanity/client'
import {type SanityClient} from 'sanity'

import {type Verdict} from './bisect'
import {type Severity} from './severity'

/**
 * bisectSession writes (see schemaTypes/bisectSession.ts). All fire-and-forget
 * from the UI — the realtime listenQuery echoes the change back, and failures
 * surface via toast (same pattern as tools/trends/useDriftState.ts).
 */

export interface NewSessionInput {
  good: {sha: string; label?: string}
  bad: {sha: string; label?: string}
  releasesOnly?: boolean
  /** Already normalized (tools/bisect/reproPath.ts) — stored as-is. */
  reproPath?: string
  /** What is broken — carried into refinements. */
  description?: string
  /** The session this one narrows down (a chain counts as one regression). */
  refines?: string
  createdBy: string
}

export interface SessionResult {
  firstBadSha: string
  lastGoodSha: string
  suspectShas: string[]
}

function endpointLabel(endpoint: {sha: string; label?: string}): string {
  return endpoint.label ?? endpoint.sha.slice(0, 7)
}

export async function createSession(client: SanityClient, input: NewSessionInput): Promise<string> {
  const created = await client.create({
    _id: bisectSessionId(crypto.randomUUID()),
    _type: 'bisectSession',
    title: `${endpointLabel(input.good)} → ${endpointLabel(input.bad)}`,
    good: input.good,
    bad: input.bad,
    ...(input.releasesOnly ? {releasesOnly: true} : {}),
    ...(input.reproPath ? {reproPath: input.reproPath} : {}),
    ...(input.description ? {description: input.description} : {}),
    ...(input.refines ? {refines: {_type: 'reference', _ref: input.refines, _weak: true}} : {}),
    marks: [],
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  })
  return created._id
}

export interface ManualRegressionInput {
  /** The release BEFORE the blamed one (base on the first-parent chain). */
  good: {sha: string; label?: string}
  /** The release the regression is pinned on. */
  bad: {sha: string; label?: string}
  /** Commits strictly between the two releases — the possible culprits. */
  suspectShas: string[]
  description: string
  severity?: Severity
  linearIssue?: string
  /** Release tag it was already fixed in, when known at report time. */
  fixedIn?: string
  createdBy: string
}

/**
 * A regression reported by hand from the Studio releases tool — no bisect was
 * run, only the introducing release is known. Stored as a bisectSession that
 * is converged from birth: releases-only endpoints at the blamed release and
 * its base, no marks, and the verdict written at creation. That keeps one
 * source of truth for regression attribution, and opening the session offers
 * the usual drill-down over the suspect commits.
 */
export async function reportRegression(
  client: SanityClient,
  input: ManualRegressionInput,
): Promise<string> {
  const created = await client.create({
    _id: bisectSessionId(crypto.randomUUID()),
    _type: 'bisectSession',
    title: `${endpointLabel(input.good)} → ${endpointLabel(input.bad)}`,
    good: input.good,
    bad: input.bad,
    releasesOnly: true,
    description: input.description,
    marks: [],
    result: {
      firstBadSha: input.bad.sha,
      lastGoodSha: input.good.sha,
      suspectShas: input.suspectShas,
      regression: true,
      ...(input.severity ? {severity: input.severity} : {}),
      ...(input.linearIssue ? {linearIssue: input.linearIssue} : {}),
      ...(input.fixedIn ? {fixedIn: input.fixedIn} : {}),
      concludedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  })
  return created._id
}

/** Sessions are the only user-owned documents here — plain hard delete. */
export function deleteSession(client: SanityClient, sessionId: string): Promise<unknown> {
  return client.delete(sessionId)
}

/** Delete a whole refinement chain at once — the chain is the regression. */
export function deleteSessions(client: SanityClient, sessionIds: string[]): Promise<unknown> {
  let transaction = client.transaction()
  for (const id of sessionIds) transaction = transaction.delete(id)
  return transaction.commit()
}

/**
 * Append a mark. Every append is authoritative about `result`: a converging
 * mark writes it in the same patch (so the list and the marks log can never
 * disagree), and a non-converging mark UNSETS it — otherwise a concurrent
 * editor's contradicting mark could leave a stale verdict on the document
 * while the live-derived state disagrees.
 */
export function appendMark(
  client: SanityClient,
  sessionId: string,
  mark: {sha: string; verdict: Verdict; markedBy: string},
  result: SessionResult | undefined,
): Promise<unknown> {
  const patch = client
    .patch(sessionId)
    .setIfMissing({marks: []})
    .append('marks', [
      {_key: crypto.randomUUID().slice(0, 8), ...mark, markedAt: new Date().toISOString()},
    ])
  return (result ? withResult(patch, result) : patch.unset(['result'])).commit()
}

/**
 * Set the verdict fields WITHOUT replacing the `result` object: annotations
 * (regression, description, linearIssue) are human-owned, and a whole-object
 * `set` racing a concurrent `updateResult` would silently destroy typed text.
 * The machine writes only the fields it derives; a stale annotation on a
 * re-derived verdict is visible and editable, a wiped one is just gone.
 */
function withResult(patch: Patch, result: SessionResult): Patch {
  return patch.setIfMissing({result: {}}).set({
    'result.firstBadSha': result.firstBadSha,
    'result.lastGoodSha': result.lastGoodSha,
    'result.suspectShas': result.suspectShas,
    'result.concludedAt': new Date().toISOString(),
  })
}

/**
 * Persist a verdict outside the mark flow — for sessions that are converged
 * from birth (adjacent endpoints, drill-downs over an untestable range),
 * where no converging mark ever fires.
 */
export function setResult(
  client: SanityClient,
  sessionId: string,
  result: SessionResult,
): Promise<unknown> {
  return withResult(client.patch(sessionId), result).commit()
}

export interface ResultAnnotations {
  regression?: boolean
  /** Lives on the session itself (`description`), not under `result` — see updateResult. */
  description?: string
  /** '' clears it. */
  severity?: Severity | ''
  linearIssue?: string
  /** Release tag the regression was fixed in (releases tool). */
  fixedIn?: string
}

/**
 * Human annotations on a concluded run — cleared string fields are unset, not
 * stored empty. `description` is the session's own field (set at creation,
 * editable here); the rest live under `result`. A legacy `result.description`
 * is unset whenever the description is written, so the two can't diverge.
 */
export function updateResult(
  client: SanityClient,
  sessionId: string,
  patch: ResultAnnotations,
): Promise<unknown> {
  const sets: Record<string, boolean | string> = {}
  const unsets: string[] = []
  for (const [key, value] of Object.entries(patch)) {
    const path = key === 'description' ? 'description' : `result.${key}`
    if (key === 'description') unsets.push('result.description')
    if (value === '' || value === undefined) unsets.push(path)
    else sets[path] = value
  }
  let mutation = client.patch(sessionId)
  if (Object.keys(sets).length > 0) mutation = mutation.set(sets)
  if (unsets.length > 0) mutation = mutation.unset(unsets)
  return mutation.commit()
}

/** Undo removes exactly one mark — and any result, since it may no longer hold. */
export function undoMark(
  client: SanityClient,
  sessionId: string,
  markKey: string,
): Promise<unknown> {
  // The key is interpolated into a patch path — ours are self-generated
  // hex, but guard anyway so a malformed key can't smuggle path syntax
  if (!/^[\w-]+$/.test(markKey)) throw new Error(`Invalid mark key: ${JSON.stringify(markKey)}`)
  return client
    .patch(sessionId)
    .unset([`marks[_key=="${markKey}"]`, 'result'])
    .commit()
}
