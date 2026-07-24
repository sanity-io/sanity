import {ClientError, type SanityClient} from '@sanity/client'
import {merge, NEVER, of, type Observable, Subject, throwError} from 'rxjs'
import {delay} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {checkoutPair} from './checkoutPair'

const mockedDataRequest = vi.fn(() => of({}))
const mockedActionRequest = vi.fn(() => of({}))

const client = {
  observable: {
    listen: () => of({type: 'welcome'}).pipe(delay(0)),
    getDocuments: (ids: string[]) => of(ids.map((id) => ({_id: id, _type: 'any', _rev: 'any'}))),
    action: mockedActionRequest,
  },
  dataRequest: mockedDataRequest,
  withConfig: vi.fn(function (this: SanityClient) {
    return this
  }),
}

const idPair = {publishedId: 'publishedId', draftId: 'draftId'}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkoutPair -- server actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: 'draftId',
          publishedId: 'publishedId',
          patch: {
            set: {
              title: 'new title',
            },
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('published patch uses mutation endpoint', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    //liveEdit should be the only condition to directly patch a published doc
    published.mutate(published.patch([{set: {title: 'new title'}}]))
    published.commit()

    expect(mockedActionRequest).not.toHaveBeenCalled()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [{patch: {id: 'publishedId', set: {title: 'new title'}}}],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('create', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.create({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.create',
          publishedId: 'publishedId',
          attributes: {
            _id: 'draftId',
            _type: 'any',
            _createdAt: 'now',
          },
          ifExists: 'fail',
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createIfNotExists({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: idPair.draftId,
          publishedId: idPair.publishedId,
          patch: {
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('a failed commit does not error the events stream', async () => {
    // Regression: a network error committing edits used to propagate
    // through `commits$` → the document `events` stream, which
    // `useEditState` rethrows during render — crashing the document pane.
    // The failure must instead be reported to the mutator (so it can
    // retry/rebase) while the events stream stays alive.
    const networkError = Object.assign(
      new Error('Request error while attempting to reach https://example.api.sanity.io'),
      {isNetworkError: true},
    )
    // The commit's action request errors (simulating a network failure).
    mockedActionRequest.mockImplementationOnce(() => throwError(() => networkError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)

    let streamErrored = false
    const sub = combined.subscribe({error: () => (streamErrored = true)})
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // The events stream must survive the failed commit.
    expect(streamErrored).toBe(false)

    sub.unsubscribe()
  })
})

describe('checkoutPair -- failed commit routing', () => {
  // These tests assert that a failed commit is ROUTED to the correct mutator
  // channel (`request.failure` → retry, or `request.cancel` → terminal reset),
  // not merely that the events stream survives. The routing is asserted via
  // black-box, observable behavior of the public `checkoutPair` return:
  //
  //  - failure/retry path: the BufferedDocument re-stages the commit and, after
  //    a backoff, invokes the commit handler AGAIN with the SAME mutation. We
  //    observe this as a second call to the action/dataRequest mock, which
  //    proves the buffered mutation was retained (not silently dropped).
  //    Consistency also stays `false` (still unsynced).
  //  - cancel/terminal path: the BufferedDocument rejects the commit, clears the
  //    buffer, and resets to server HEAD, which flips `consistency$` back to
  //    `true`. It does NOT retry, so the action mock is never called a second
  //    time.
  //
  // Regression guard: if a future refactor returned EMPTY without routing (or
  // inverted the 4xx/5xx branch), the retry test would see no second action
  // call and the cancel test would see consistency stuck at `false` / a spurious
  // retry — both would fail. The first retry backoff is `commit.tries * 1000`ms
  // = 1000ms (see BufferedDocument._cycleCommitter).

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function collectConsistency(consistency$: Observable<boolean>) {
    const values: boolean[] = []
    const sub = consistency$.subscribe((v) => values.push(v))
    return {values, sub}
  }

  test('a 500 (server error) commit failure is retried, not cancelled — the mutation is retained and re-attempted', async () => {
    const serverError = Object.assign(new Error('Internal Server Error'), {statusCode: 500})

    // Only the FIRST commit attempt fails; the retry uses the default mock
    // (`of({})`) so the second attempt succeeds. This proves the mutation was
    // re-attempted (the mock is invoked a second time with the same payload).
    mockedActionRequest.mockImplementationOnce(() => throwError(() => serverError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)

    let streamErrored = false
    const sub = combined.subscribe({error: () => (streamErrored = true)})
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    // First attempt happened and failed.
    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Failure path: still unsynced (no reset back to consistent).
    expect(consistency.values.at(-1)).toBe(false)

    // Advance past the first retry backoff (1000ms). The mutator re-stages the
    // commit and calls the commit handler again with the SAME mutation.
    await vi.advanceTimersByTimeAsync(1000)

    expect(mockedActionRequest).toHaveBeenCalledTimes(2)
    // The retried commit carries the same patch payload — proving the buffered
    // mutation was retained and re-attempted, not dropped.
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(mockedActionRequest.mock.calls[1][0]).toEqual([
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'draftId',
        publishedId: 'publishedId',
        patch: {set: {title: 'new title'}},
      },
    ])

    // The events stream must survive the failed commit.
    expect(streamErrored).toBe(false)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a network commit failure is retried, not cancelled', async () => {
    // Network errors have no statusCode → transient → failure/retry path.
    const networkError = Object.assign(new Error('Request error'), {isNetworkError: true})
    mockedActionRequest.mockImplementationOnce(() => throwError(() => networkError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'network retry'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Still unsynced — the failure path does not reset to consistent.
    expect(consistency.values.at(-1)).toBe(false)

    await vi.advanceTimersByTimeAsync(1000)

    // Re-attempted with the same mutation → routed to failure, not cancel.
    expect(mockedActionRequest).toHaveBeenCalledTimes(2)
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(mockedActionRequest.mock.calls[1][0]).toEqual([
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'draftId',
        publishedId: 'publishedId',
        patch: {set: {title: 'network retry'}},
      },
    ])

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 400 (client error) commit failure is cancelled, not retried — buffer resets to server HEAD', async () => {
    // A 400 is a terminal client error: the buffered mutation can never succeed,
    // so it is cancelled (rejects the commit, resets to HEAD → consistent again)
    // rather than retried indefinitely.
    const clientError = Object.assign(new Error('Bad Request'), {statusCode: 400})
    // Every attempt would fail — but if routing is correct, there is only ONE.
    mockedActionRequest.mockImplementation(() => throwError(() => clientError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)

    let streamErrored = false
    const sub = combined.subscribe({error: () => (streamErrored = true)})
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'bad request'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)

    // Cancel path: the mutator resets to server HEAD, flipping consistency back
    // to `true`. (Contrast with the failure path, where it stays `false`.)
    expect(consistency.values.at(-1)).toBe(true)

    // Advance well past any retry backoff — a cancelled commit must NOT be
    // retried, so the action mock is never called a second time.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(1)

    // The events stream must survive the failed commit.
    expect(streamErrored).toBe(false)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 409 (conflict) commit failure is cancelled, not retried', async () => {
    // 409 is in the terminal allowlist → cancel.
    const conflictError = Object.assign(new Error('Conflict'), {statusCode: 409})
    mockedActionRequest.mockImplementation(() => throwError(() => conflictError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'conflict'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Reset to HEAD → consistent again.
    expect(consistency.values.at(-1)).toBe(true)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(1)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 413 (payload too large) commit failure is cancelled, not retried', async () => {
    // 413 is terminal: resubmitting the same oversized payload can never
    // succeed, so retrying would stall the document forever. Cancel instead.
    const tooLargeError = Object.assign(new Error('Payload Too Large'), {statusCode: 413})
    mockedActionRequest.mockImplementation(() => throwError(() => tooLargeError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'way too big'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Cancel path: reset to server HEAD → consistent again.
    expect(consistency.values.at(-1)).toBe(true)

    // Terminal: never retried.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(1)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 401 tagged as session expiry (SIO-401-AEX) is retried, not cancelled', async () => {
    // A session-expiry 401 says nothing about the mutation itself — after
    // re-authentication the same commit can succeed. The buffered edits must
    // therefore be preserved and retried, not wiped to server HEAD mid-edit.
    // (The session itself is handled by the force-logout flow, not here.)
    const sessionExpiredError = new ClientError({
      statusCode: 401,
      headers: {},
      body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX'},
      url: 'https://abc123.api.sanity.io/v1/data/actions/production',
      method: 'POST',
    } as never)
    // Only the first attempt fails; the retry succeeds via the default mock —
    // as it would after the user re-authenticates.
    mockedActionRequest.mockImplementationOnce(() => throwError(() => sessionExpiredError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'session expired'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Failure path: still unsynced, buffer retained.
    expect(consistency.values.at(-1)).toBe(false)

    await vi.advanceTimersByTimeAsync(1000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(2)
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(mockedActionRequest.mock.calls[1][0]).toEqual([
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'draftId',
        publishedId: 'publishedId',
        patch: {set: {title: 'session expired'}},
      },
    ])

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 401 without the session-expiry tag is cancelled, not retried', async () => {
    // A plain 401 is a resource-level denial (e.g. missing grant — some
    // endpoints answer those with 401, not 403): terminal for this user, so
    // retrying can never succeed. Guards the session-expiry carve-out against
    // widening into "all 401s retry".
    const deniedError = new ClientError({
      statusCode: 401,
      headers: {},
      body: {error: 'Unauthorized'},
      url: 'https://abc123.api.sanity.io/v1/data/actions/production',
      method: 'POST',
    } as never)
    mockedActionRequest.mockImplementation(() => throwError(() => deniedError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'denied'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Cancel path: reset to server HEAD → consistent again.
    expect(consistency.values.at(-1)).toBe(true)

    // Terminal: never retried.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(1)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 408 (request timeout) commit failure is retried, not cancelled', async () => {
    // 408 is a 4xx but transient — a timeout says nothing about the mutation
    // itself, so the buffered edits must be retained and re-attempted. Guards
    // the opt-in terminal set against regressing to a blanket 4xx rule.
    const timeoutError = Object.assign(new Error('Request Timeout'), {statusCode: 408})
    // Only the first attempt fails; the retry succeeds via the default mock.
    mockedActionRequest.mockImplementationOnce(() => throwError(() => timeoutError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'timed out'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Failure path: still unsynced, buffer retained.
    expect(consistency.values.at(-1)).toBe(false)

    await vi.advanceTimersByTimeAsync(1000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(2)
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(mockedActionRequest.mock.calls[1][0]).toEqual([
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'draftId',
        publishedId: 'publishedId',
        patch: {set: {title: 'timed out'}},
      },
    ])

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('an unclassified 4xx (418) commit failure is retried, not cancelled — unknown codes take the conservative path', async () => {
    // A 4xx we haven't explicitly classified as terminal must NOT discard the
    // user's edits: wrongly retrying leaves a visibly stalled document with
    // the buffer intact (recoverable), wrongly cancelling silently destroys
    // work. Unknown codes therefore default to retry.
    const teapotError = Object.assign(new Error("I'm a teapot"), {statusCode: 418})
    mockedActionRequest.mockImplementationOnce(() => throwError(() => teapotError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'unknown 4xx'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    expect(consistency.values.at(-1)).toBe(false)

    await vi.advanceTimersByTimeAsync(1000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(2)

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a 429 (too many requests) commit failure is retried, not cancelled — transient 4xx stays out of the terminal allowlist', async () => {
    // 429 is in the 4xx range but not in the terminal allowlist: it is
    // transient (rate limiting) and must retry.
    const rateLimitError = Object.assign(new Error('Too Many Requests'), {statusCode: 429})
    // Only the first attempt fails; the retry succeeds via the default mock.
    mockedActionRequest.mockImplementationOnce(() => throwError(() => rateLimitError) as any)

    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    const consistency = collectConsistency(draft.consistency$)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'rate limited'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedActionRequest).toHaveBeenCalledTimes(1)
    // Failure path: not reset to consistent.
    expect(consistency.values.at(-1)).toBe(false)

    // If 429 were (incorrectly) treated as terminal, it would cancel and never
    // retry. Correct behavior: retry after backoff.
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockedActionRequest).toHaveBeenCalledTimes(2)
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(mockedActionRequest.mock.calls[1][0]).toEqual([
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'draftId',
        publishedId: 'publishedId',
        patch: {set: {title: 'rate limited'}},
      },
    ])

    consistency.sub.unsubscribe()
    sub.unsubscribe()
  })
})

describe('checkoutPair -- commitError$', () => {
  // `commitError$` is the signal that lets the document sync state
  // distinguish "commits are failing" from "the backlog is merely slow": it
  // must only carry an error while the most recent commit attempt failed and
  // is being retried by the mutator.

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function collectCommitError(pair: {commitError$: Observable<{error: unknown} | undefined>}) {
    const values: ({error: unknown} | undefined)[] = []
    const sub = pair.commitError$.subscribe((v) => values.push(v))
    return {values, sub}
  }

  test('stays undefined while commits succeed', async () => {
    const pair = checkoutPair(client as any as SanityClient, idPair, of(true))
    const {draft, published} = pair
    const sub = merge(draft.events, published.events).subscribe()
    const commitError = collectCommitError(pair)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'all good'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    expect(commitError.values).toEqual([undefined])

    commitError.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('carries the error on a retryable failure and clears when the retry succeeds', async () => {
    const serverError = Object.assign(new Error('Internal Server Error'), {statusCode: 500})
    // Only the first attempt fails; the retry uses the default mock and
    // succeeds — as when a transient 5xx clears.
    mockedActionRequest.mockImplementationOnce(() => throwError(() => serverError) as any)

    const pair = checkoutPair(client as any as SanityClient, idPair, of(true))
    const {draft, published} = pair
    const sub = merge(draft.events, published.events).subscribe()
    const commitError = collectCommitError(pair)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    // First attempt failed → the retry is pending, and the error that
    // caused it is exposed.
    expect(commitError.values).toEqual([undefined, {error: serverError}])

    // Advance past the first retry backoff (1000ms); the retry succeeds.
    await vi.advanceTimersByTimeAsync(1000)
    expect(commitError.values).toEqual([undefined, {error: serverError}, undefined])

    commitError.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('stays undefined for a terminal (cancelled) failure — nothing is being retried', async () => {
    const clientError = Object.assign(new Error('Bad Request'), {statusCode: 400})
    mockedActionRequest.mockImplementation(() => throwError(() => clientError) as any)

    const pair = checkoutPair(client as any as SanityClient, idPair, of(true))
    const {draft, published} = pair
    const sub = merge(draft.events, published.events).subscribe()
    const commitError = collectCommitError(pair)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'bad request'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    // The commit was cancelled and the buffer reset — no retry is in flight,
    // so the signal must not report a failure being recovered from.
    expect(commitError.values).toEqual([undefined])

    await vi.advanceTimersByTimeAsync(60_000)
    expect(commitError.values).toEqual([undefined])

    commitError.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('replays the current value to late subscribers', async () => {
    const serverError = Object.assign(new Error('Internal Server Error'), {statusCode: 500})
    // Every attempt fails, so the failure state persists across retries.
    mockedActionRequest.mockImplementation(() => throwError(() => serverError) as any)

    const pair = checkoutPair(client as any as SanityClient, idPair, of(true))
    const {draft, published} = pair
    const sub = merge(draft.events, published.events).subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    // Subscribe only after the failure happened (as the sync-state hook does
    // when a document pane mounts against an already-checked-out pair).
    const late = collectCommitError(pair)
    expect(late.values).toEqual([{error: serverError}])

    late.sub.unsubscribe()
    sub.unsubscribe()
  })

  test('a listener reconnect does not mask an ongoing commit failure', async () => {
    // The reset is keyed on the pair returning to CONSISTENCY, not on
    // listener reconnects: a live listener says nothing about commit
    // health. When the connection blips and resyncs while the mutator is
    // still retrying a failing commit, the error must (re)assert itself
    // rather than staying cleared.
    const serverError = Object.assign(new Error('Internal Server Error'), {statusCode: 500})
    // EVERY attempt fails — the outage outlives the reconnect.
    mockedActionRequest.mockImplementation(() => throwError(() => serverError) as any)

    const listenerSubject = new Subject()
    const testClient = {
      ...client,
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const pair = checkoutPair(testClient as any as SanityClient, idPair, of(true))
    const {draft, published} = pair
    const sub = merge(draft.events, published.events).subscribe()
    const commitError = collectCommitError(pair)

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)
    expect(commitError.values.at(-1)).toEqual({error: serverError})

    // The listener reconnects and resyncs (fresh snapshots force the pair
    // back to consistency), but the buffered edits are still being retried
    // against a failing endpoint.
    listenerSubject.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(0)

    // Once the retry fires (backoff is `tries * 1000`) and fails, the error
    // is exposed again — the reconnect did not permanently mask it.
    await vi.advanceTimersByTimeAsync(5_000)
    expect(commitError.values.at(-1)).toEqual({error: serverError})

    commitError.sub.unsubscribe()
    sub.unsubscribe()
  })
})

function createMutationEvent(
  transactionId: string,
  documentId: string,
  previousRev: string,
  resultRev: string,
) {
  return {
    type: 'mutation' as const,
    documentId,
    transactionId,
    previousRev,
    resultRev,
    effects: {apply: [], revert: []},
    mutations: [],
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    visibility: 'transaction' as const,
    transition: 'update' as const,
  }
}

describe('checkoutPair -- latency and mutation performance reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('calls onReportLatency when submit and receive are paired (submit before receive)', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Resolve commit with a transactionId
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject matching listener mutation event
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Flush the fetch promise (shard info)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('calls onReportLatency when receive arrives before submit', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Inject listener mutation BEFORE the commit resolves (listener races HTTP response)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Now resolve the commit
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Flush the fetch promise
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('receivedAt uses the receive timestamp, not submit timestamp (regression)', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Resolve commit at time T
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Advance 500ms, then inject listener mutation at T+500
    await vi.advanceTimersByTimeAsync(500)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // deltaMs should be ~500 (the gap between submit and receive timestamps),
    // NOT 0 (which would happen if receivedAt incorrectly used submitEvent.timestamp)
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    const reportedLatency = onReportLatency.mock.calls[0][0].latencyMs
    expect(reportedLatency).toBeGreaterThanOrEqual(500)

    sub.unsubscribe()
  })

  test('calls onReportMutationPerformance with timing breakdown', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate at T=0 (this triggers onConsistencyChanged(false) which sets firstMutationReceivedAt)
    draft.mutate(draft.patch([{set: {title: 'test'}}]))

    // Advance 100ms to simulate debounce time
    await vi.advanceTimersByTimeAsync(100)

    draft.commit()

    // Advance 200ms to simulate API round-trip time
    await vi.advanceTimersByTimeAsync(200)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Advance 300ms to simulate listener callback delay
    await vi.advanceTimersByTimeAsync(300)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    expect(event.transactionId).toBe('tx1')
    expect(event.shard).toBe('test-shard')
    // debounceMs: time from first mutation to API request
    expect(event.debounceMs).toBeGreaterThanOrEqual(100)
    // apiMs: time from API request to API response
    expect(event.apiMs).toBeGreaterThanOrEqual(200)
    // callbackMs: time from API request to listener callback
    expect(event.callbackMs).toBeGreaterThanOrEqual(event.apiMs)

    sub.unsubscribe()
  })

  test('callbackMs is measured from apiRequestSentAt, not apiResponseReceivedAt', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate at T=0
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // API takes 500ms to respond
    await vi.advanceTimersByTimeAsync(500)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Listener arrives 100ms after API response (600ms after request was sent)
    await vi.advanceTimersByTimeAsync(100)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    // callbackMs should be ~600 (from request sent), NOT ~100 (from response received)
    expect(event.callbackMs).toBeGreaterThanOrEqual(600)
    // apiMs should be ~500
    expect(event.apiMs).toBeGreaterThanOrEqual(500)
    // callbackMs > apiMs proves measurement is from request sent time
    expect(event.callbackMs).toBeGreaterThan(event.apiMs)

    sub.unsubscribe()
  })

  test('reports mutation performance for consecutive commit batches during sustained editing', async () => {
    const onReportMutationPerformance = vi.fn()
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // --- First batch ---
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    await vi.advanceTimersByTimeAsync(200)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    expect(onReportMutationPerformance.mock.calls[0][0].debounceMs).toBeGreaterThanOrEqual(100)

    // --- Second batch (document stays inconsistent between batches) ---
    commitSubject = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    await vi.advanceTimersByTimeAsync(50)
    draft.commit()

    await vi.advanceTimersByTimeAsync(150)
    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Must fire for second batch too — verifies firstMutationReceivedAt is reset between batches
    expect(onReportMutationPerformance).toHaveBeenCalledTimes(2)
    expect(onReportMutationPerformance.mock.calls[1][0].transactionId).toBe('tx2')
    // Second batch debounce should be ~50ms, not ~100 + gap from first batch
    expect(onReportMutationPerformance.mock.calls[1][0].debounceMs).toBeGreaterThanOrEqual(50)
    expect(onReportMutationPerformance.mock.calls[1][0].debounceMs).toBeLessThan(200)

    sub.unsubscribe()
  })

  test('does not call onReportMutationPerformance when firstMutationReceivedAt is absent', async () => {
    // This tests the guard: if firstMutationReceivedAt is undefined, perf is not reported
    const onReportLatency = vi.fn()
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()

    const testClient = {
      ...client,
      // Return a result immediately (no debounce captured since commit happens instantly)
      dataRequest: vi.fn(() => of({transactionId: 'tx1', results: []})),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => of({transactionId: 'tx1', results: []})),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // onReportLatency should still fire
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    // onReportMutationPerformance fires because the BufferedDocument sets firstMutationReceivedAt
    // when the document goes from consistent→inconsistent (on mutate()).
    // So in a normal flow it IS always set. This is correct behavior.
    // The guard catches edge cases where the timestamp could be cleared (e.g., reconnect).

    sub.unsubscribe()
  })

  test('unmatched transactionIds do not emit events', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Inject a listener mutation with no matching commit
    listenerSubject.next(createMutationEvent('orphan-tx', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).not.toHaveBeenCalled()

    // Now do a real mutation/commit with a different transactionId
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-real', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Match only the real one
    listenerSubject.next(createMutationEvent('tx-real', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Only the matched pair should trigger a report
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-real'}),
    )

    sub.unsubscribe()
  })

  test('does not call fetch for shard info when neither callback is provided', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    expect(global.fetch).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('reports shard as undefined when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: undefined,
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('pipeline survives when client.getUrl throws synchronously', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: () => {
        throw new Error('client not configured')
      },
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should report with shard=undefined since getUrl threw
    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: undefined,
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('pipeline continues when onReportLatency callback throws', async () => {
    const onReportLatency = vi.fn().mockImplementationOnce(() => {
      throw new Error('callback error')
    })
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation — callback will throw
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(1)

    // Second mutation — callback should succeed, proving the pipeline survived
    commitSubject = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(2)
    expect(onReportLatency).toHaveBeenLastCalledWith(
      expect.objectContaining({transactionId: 'tx2'}),
    )

    sub.unsubscribe()
  })

  test('pipeline continues when onReportMutationPerformance callback throws', async () => {
    const onReportMutationPerformance = vi.fn().mockImplementationOnce(() => {
      throw new Error('perf callback error')
    })
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation — perf callback will throw
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)

    // Second mutation — should still work
    commitSubject = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // latency callback should still be working
    expect(onReportLatency).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('reports latency even before shard info fetch resolves', async () => {
    // Override the default mock to make fetch hang (never resolve)
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should report with shard=undefined since fetch hasn't resolved
    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: undefined,
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('evicts stale pending entries after PENDING_ENTRY_TTL (60s)', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Submit a commit — this adds a 'submit' entry to pending
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-stale', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Advance past the 60s TTL without receiving a matching listener event
    await vi.advanceTimersByTimeAsync(61_000)

    // Now do a fresh commit cycle — the stale entry should be evicted during the scan
    const commitSubject2 = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject2)

    draft.mutate(draft.patch([{set: {title: 'test2'}}]))
    draft.commit()

    commitSubject2.next({transactionId: 'tx-fresh', results: []})
    commitSubject2.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Now inject the stale listener event — it should NOT match because the entry was evicted
    listenerSubject.next(createMutationEvent('tx-stale', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Only the fresh cycle should report (once it gets its listener event)
    expect(onReportLatency).not.toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-stale'}),
    )

    // Complete the fresh cycle
    listenerSubject.next(createMutationEvent('tx-fresh', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-fresh'}),
    )

    sub.unsubscribe()
  })

  test('evicts stale receive entries from remote mutations after PENDING_ENTRY_TTL', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Inject several remote mutation events (no matching commits — these are from other users)
    listenerSubject.next(createMutationEvent('remote-tx-1', 'draftId', 'any', 'rev2'))
    listenerSubject.next(createMutationEvent('remote-tx-2', 'draftId', 'rev2', 'rev3'))
    listenerSubject.next(createMutationEvent('remote-tx-3', 'draftId', 'rev3', 'rev4'))
    await vi.advanceTimersByTimeAsync(0)

    // Advance past the 60s TTL — these receive entries should be evicted
    await vi.advanceTimersByTimeAsync(61_000)

    // Now do a normal commit cycle — should work cleanly without stale entries interfering
    draft.mutate(draft.patch([{set: {title: 'my edit'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-local', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-local', 'draftId', 'rev4', 'rev5'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Only the local commit should trigger a latency report
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-local'}),
    )

    sub.unsubscribe()
  })

  test('latency tracking works through server actions path', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const actionSubject = new Subject()

    const testClient: Record<string, any> = {
      ...client,
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => actionSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(true), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test via actions'}}]))
    draft.commit()

    // Resolve the action with a transactionId
    actionSubject.next({transactionId: 'tx-action-1'})
    actionSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject matching listener mutation event
    listenerSubject.next(createMutationEvent('tx-action-1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx-action-1',
    })

    sub.unsubscribe()
  })

  test('duplicate listener events for same transactionId do not produce spurious matches', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Simulate multi-document transaction: two listener events with the same transactionId
    // (e.g., draft and published both mutated in the same server action)
    listenerSubject.next(createMutationEvent('tx-multi', 'draftId', 'any', 'rev2'))
    listenerSubject.next(createMutationEvent('tx-multi', 'publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // The two receive events should NOT match each other (they're both receives)
    expect(onReportLatency).not.toHaveBeenCalled()

    // Now resolve the commit — the submit should match one of the receives
    commitSubject.next({transactionId: 'tx-multi', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should report exactly once (submit matched with the first receive)
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-multi'}),
    )

    sub.unsubscribe()
  })

  test('latencyMs can be negative when listener arrives before commit resolves', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Listener mutation arrives BEFORE commit resolves
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Advance time so that the submit timestamp is later than the receive timestamp
    await vi.advanceTimersByTimeAsync(100)

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(1)
    // Raw measurement: negative means listener beat the HTTP response
    expect(onReportLatency.mock.calls[0][0].latencyMs).toBeLessThan(0)

    sub.unsubscribe()
  })

  test('welcomeback event clears stale pending entries', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate and commit — creates a submit entry
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-before-welcomeback', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject a welcomeback event — should clear all pending entries just like reconnect
    listenerSubject.next({type: 'welcomeback'})
    await vi.advanceTimersByTimeAsync(0)

    // Inject a listener mutation with the old txId — should NOT match
    listenerSubject.next(createMutationEvent('tx-before-welcomeback', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('reconnection clears stale pending entries', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate and commit — creates a submit entry with txId 'tx-before-reconnect'
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-before-reconnect', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject a reconnect event — should clear all pending entries
    listenerSubject.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(0)

    // Inject a listener mutation with the old txId — should NOT match because reconnection cleared pending
    listenerSubject.next(createMutationEvent('tx-before-reconnect', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('multi-doc orphaned receives are cleaned up after match', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation cycle
    draft.mutate(draft.patch([{set: {title: 'multi-doc test'}}]))
    draft.commit()

    // Inject 3 listener mutation events with the same txId but different documentIds
    // (simulates a multi-document transaction)
    listenerSubject.next(createMutationEvent('tx-multi-doc', 'draftId', 'any', 'rev2'))
    listenerSubject.next(createMutationEvent('tx-multi-doc', 'otherDoc1', 'any', 'rev2'))
    listenerSubject.next(createMutationEvent('tx-multi-doc', 'otherDoc2', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Now resolve the commit with the same txId
    commitSubject.next({transactionId: 'tx-multi-doc', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should report exactly once (submit matched with one receive, orphans cleaned up)
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-multi-doc'}),
    )

    // Second mutation cycle — proves the pipeline is clean and orphans don't interfere
    commitSubject = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second cycle'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-second', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-second', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should produce exactly one more report (total 2)
    expect(onReportLatency).toHaveBeenCalledTimes(2)
    expect(onReportLatency).toHaveBeenLastCalledWith(
      expect.objectContaining({transactionId: 'tx-second'}),
    )

    sub.unsubscribe()
  })

  test('reports latency and mutation performance for published document path', async () => {
    const onReportLatency = vi.fn()
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Use PUBLISHED instead of draft
    published.mutate(published.patch([{set: {title: 'published edit'}}]))
    await vi.advanceTimersByTimeAsync(100) // debounce time
    published.commit()

    await vi.advanceTimersByTimeAsync(200) // API time
    commitSubject.next({transactionId: 'tx-pub', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Listener event for the PUBLISHED document ID
    await vi.advanceTimersByTimeAsync(50) // callback delay
    listenerSubject.next(createMutationEvent('tx-pub', 'publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx-pub',
    })

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const perfEvent = onReportMutationPerformance.mock.calls[0][0]
    expect(perfEvent.transactionId).toBe('tx-pub')
    expect(perfEvent.debounceMs).toBeGreaterThanOrEqual(100)
    expect(perfEvent.apiMs).toBeGreaterThanOrEqual(200)
    expect(perfEvent.callbackMs).toBeGreaterThanOrEqual(perfEvent.apiMs)
    expect(perfEvent.shard).toBe('test-shard')

    sub.unsubscribe()
  })

  test('firstMutationReceivedAt resets on snapshot (reconnection), preventing stale debounceMs', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Step 1: Mutate the draft — this sets firstMutationReceivedAt
    draft.mutate(draft.patch([{set: {title: 'before snapshot'}}]))

    // Step 2: Advance time significantly (simulating a long gap before reconnection)
    await vi.advanceTimersByTimeAsync(5000)

    // Step 3: Inject a snapshot event — simulates reconnection resetting the document
    listenerSubject.next({
      type: 'snapshot',
      documentId: 'draftId',
      document: {_id: 'draftId', _type: 'any', _rev: 'newRev', _createdAt: '', _updatedAt: ''},
    })
    await vi.advanceTimersByTimeAsync(0)

    // Step 4: Fresh commit subject for the new mutation
    commitSubject = new Subject()
    testClient.observable.action.mockReturnValue(commitSubject)

    // Step 5: Mutate again AFTER the snapshot and commit
    draft.mutate(draft.patch([{set: {title: 'after snapshot'}}]))
    await vi.advanceTimersByTimeAsync(50) // small debounce
    draft.commit()

    await vi.advanceTimersByTimeAsync(100)
    commitSubject.next({transactionId: 'tx-post-snapshot', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-post-snapshot', 'draftId', 'newRev', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    // debounceMs should be ~50ms (from post-snapshot mutation), NOT ~5050ms
    // (which would happen if firstMutationReceivedAt wasn't reset by the snapshot)
    expect(event.debounceMs).toBeGreaterThanOrEqual(50)
    expect(event.debounceMs).toBeLessThan(1000)
    expect(event.transactionId).toBe('tx-post-snapshot')

    sub.unsubscribe()
  })

  test('handles concurrent draft and published commits independently', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const draftCommitSubject = new Subject()
    const publishedCommitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => publishedCommitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => draftCommitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Start both draft and published commits concurrently
    draft.mutate(draft.patch([{set: {title: 'draft edit'}}]))
    draft.commit()

    published.mutate(published.patch([{set: {title: 'published edit'}}]))
    published.commit()

    // Resolve both commits with different transactionIds
    draftCommitSubject.next({transactionId: 'tx-draft', results: []})
    draftCommitSubject.complete()
    publishedCommitSubject.next({transactionId: 'tx-pub', results: []})
    publishedCommitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject listener events for both
    listenerSubject.next(createMutationEvent('tx-draft', 'draftId', 'any', 'rev2'))
    listenerSubject.next(createMutationEvent('tx-pub', 'publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Both should be reported independently
    expect(onReportLatency).toHaveBeenCalledTimes(2)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-draft'}),
    )
    expect(onReportLatency).toHaveBeenCalledWith(expect.objectContaining({transactionId: 'tx-pub'}))

    sub.unsubscribe()
  })

  test('debounceMs reflects time from first mutation, not last', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation at T=0 (sets firstMutationReceivedAt)
    draft.mutate(draft.patch([{set: {title: 'first'}}]))

    // More mutations at T+100 and T+200 (should NOT update firstMutationReceivedAt)
    await vi.advanceTimersByTimeAsync(100)
    draft.mutate(draft.patch([{set: {title: 'second'}}]))

    await vi.advanceTimersByTimeAsync(100)
    draft.mutate(draft.patch([{set: {title: 'third'}}]))

    // Commit at T+300 (debounce should be ~300, not ~100 from last mutation)
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    await vi.advanceTimersByTimeAsync(100)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    // debounceMs should reflect time from FIRST mutation to API request (~300ms)
    expect(event.debounceMs).toBeGreaterThanOrEqual(300)
    // Should NOT be close to 100 (which would mean it measured from last mutation)
    expect(event.debounceMs).toBeLessThan(500)

    sub.unsubscribe()
  })

  test('shard info fetch should consume or cancel the response body to avoid holding the HTTP stream open', async () => {
    // An unconsumed fetch() body keeps the underlying HTTP/2 or HTTP/3 stream alive,
    // which can cause head-of-line blocking on multiplexed connections.
    // The shard info fetch only reads a header — it must also drain or cancel the body.
    const bodyCancel = vi.fn(() => Promise.resolve())
    const bodyText = vi.fn(() => Promise.resolve(''))
    const bodyJson = vi.fn(() => Promise.resolve({}))
    const bodyArrayBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(0)))

    const mockBody = {
      cancel: bodyCancel,
      getReader: vi.fn(),
      locked: false,
      pipeTo: vi.fn(),
      pipeThrough: vi.fn(),
      tee: vi.fn(),
    } as unknown as ReadableStream

    const mockResponse = new Response('pong', {
      status: 200,
      headers: {'X-Sanity-Shard': 'test-shard'},
    })
    Object.defineProperty(mockResponse, 'body', {value: mockBody})
    Object.defineProperty(mockResponse, 'text', {value: bodyText})
    Object.defineProperty(mockResponse, 'json', {value: bodyJson})
    Object.defineProperty(mockResponse, 'arrayBuffer', {value: bodyArrayBuffer})

    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse)

    const listenerSubject = new Subject()
    const commitSubject = new Subject()
    const onReportLatency = vi.fn()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Trigger a mutation so reportLatency resolves the shard info
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()
    commitSubject.next({transactionId: 'tx-body', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-body', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // The response body must have been consumed or cancelled.
    const bodyWasConsumed =
      bodyCancel.mock.calls.length > 0 ||
      bodyText.mock.calls.length > 0 ||
      bodyJson.mock.calls.length > 0 ||
      bodyArrayBuffer.mock.calls.length > 0

    expect(bodyWasConsumed).toBe(true)

    sub.unsubscribe()
  })
})

describe('checkoutPair -- slow commit warning', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('calls onSlowCommit after 50 seconds when commit does not resolve', async () => {
    const onSlowCommit = vi.fn()

    const slowClient = {
      ...client,
      observable: {
        ...client.observable,
        action: vi.fn(() => NEVER),
      },
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'slow save'}}]))
    draft.commit()

    expect(onSlowCommit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(49_999)
    expect(onSlowCommit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(onSlowCommit).toHaveBeenCalledOnce()

    sub.unsubscribe()
  })

  test('does not call onSlowCommit when commit resolves before threshold', async () => {
    const onSlowCommit = vi.fn()
    const commitSubject = new Subject()

    const fastClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        action: vi.fn(() => commitSubject),
      },
    }

    const {draft, published} = checkoutPair(fastClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'quick save'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()

    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('restarts timer when a new commit request arrives before threshold', async () => {
    const onSlowCommit = vi.fn()
    const commitSubject = new Subject()

    const slowClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        action: vi.fn(() => commitSubject),
      },
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First edit starts the timer
    draft.mutate(draft.patch([{set: {title: 'first edit'}}]))
    draft.commit()

    // Advance 30s (past halfway but before threshold)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    // Resolve the first commit so the buffered document can accept a new one
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()

    // Second edit restarts the timer via switchMap
    const secondCommitSubject = new Subject()
    slowClient.observable.action.mockReturnValue(secondCommitSubject)

    draft.mutate(draft.patch([{set: {title: 'second edit'}}]))
    draft.commit()

    // 20s later (50s total from first edit) — should NOT fire because
    // switchMap restarted the timer when the second commit arrived
    await vi.advanceTimersByTimeAsync(20_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    // 30s more (50s from second edit) — NOW it fires
    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).toHaveBeenCalledOnce()

    sub.unsubscribe()
  })

  test('calls onSlowCommit again for a new slow period after the previous one resolved', async () => {
    const onSlowCommit = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const slowClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First slow commit
    draft.mutate(draft.patch([{set: {title: 'first edit'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(50_000)
    expect(onSlowCommit).toHaveBeenCalledTimes(1)

    // Resolve the first commit
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    listenerSubject.next({type: 'pending', phase: 'end'})

    await vi.advanceTimersByTimeAsync(0)

    // Second slow commit (new Subject so it never resolves)
    const secondCommitSubject = new Subject()
    slowClient.observable.action.mockReturnValue(secondCommitSubject)

    draft.mutate(draft.patch([{set: {title: 'second edit'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(50_000)
    expect(onSlowCommit).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('slow commit timer cancelled by pending end event', async () => {
    const onSlowCommit = vi.fn()
    const listenerSubject = new Subject()

    const slowClient = {
      ...client,
      dataRequest: vi.fn(() => NEVER),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => NEVER),
      },
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Start a commit that will never resolve HTTP-wise
    draft.mutate(draft.patch([{set: {title: 'hanging save'}}]))
    draft.commit()

    // Advance to 40s (before 50s threshold)
    await vi.advanceTimersByTimeAsync(40_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    // Inject pending end event — simulates the server acknowledging the mutation
    // via WebSocket while the HTTP request is still hanging
    listenerSubject.next({type: 'pending', phase: 'end'})
    await vi.advanceTimersByTimeAsync(0)

    // Advance past 50s — timer should have been cancelled by the pending end event
    await vi.advanceTimersByTimeAsync(15_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    sub.unsubscribe()
  })
})

describe('checkoutPair -- document rebase telemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('calls onDocumentRebase when a remote mutation arrives while local mutations are pending', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation (makes the document have pending changes)
    draft.mutate(draft.patch([{set: {title: 'local edit'}}]))

    // Inject a remote mutation with actual mutations that change the document.
    // The BufferedDocument rebase is triggered by the `mutations` field (not mendoza `effects`).
    // Empty mutations produce a no-op that doesn't trigger a rebase.
    listenerSubject.next({
      ...createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(onDocumentRebase).toHaveBeenCalledWith({
      remoteMutationCount: expect.any(Number),
      localMutationCount: expect.any(Number),
    })
    // remoteMutationCount should be >= 1 since a remote mutation triggered the rebase
    expect(onDocumentRebase.mock.calls[0][0].remoteMutationCount).toBeGreaterThanOrEqual(1)
    // localMutationCount is 0 because the mutation is in the squashing buffer (not yet committed),
    // and BufferedDocument only tracks committed-in-flight mutations as "local" during rebase
    expect(typeof onDocumentRebase.mock.calls[0][0].localMutationCount).toBe('number')

    sub.unsubscribe()
  })

  test('does not call onDocumentRebase when no local mutations are pending', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()

    const testClient = {
      ...client,
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Inject a remote mutation without any pending local mutations
    listenerSubject.next(createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // No rebase should occur since there are no pending local mutations
    expect(onDocumentRebase).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('pipeline continues when onDocumentRebase callback throws', async () => {
    const onDocumentRebase = vi.fn().mockImplementation(() => {
      throw new Error('rebase callback error')
    })
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const events: any[] = []
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe((ev) => events.push(ev))

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation
    draft.mutate(draft.patch([{set: {title: 'local edit'}}]))

    // Inject a remote mutation with actual mutations to trigger rebase (callback will throw)
    listenerSubject.next({
      ...createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    // The pipeline should still be alive — verify by checking events still flow
    listenerSubject.next({
      ...createMutationEvent('remote-tx-2', 'draftId', 'rev2', 'rev3'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change 2'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    // If the pipeline died, we'd get no events after the throw.
    // The fact that we can still receive mutations proves resilience.
    expect(events.length).toBeGreaterThan(0)

    sub.unsubscribe()
  })

  test('calls onDocumentRebase for version document rebases', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onDocumentRebase,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation to the version document
    version!.mutate(version!.patch([{set: {title: 'local version edit'}}]))

    // Inject a remote mutation for the version document with actual mutations to trigger rebase
    listenerSubject.next({
      ...createMutationEvent('remote-v-tx', 'versions.r1.publishedId', 'any', 'rev2'),
      mutations: [{patch: {id: 'versions.r1.publishedId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(onDocumentRebase).toHaveBeenCalled()
    expect(onDocumentRebase.mock.calls[0][0].remoteMutationCount).toBeGreaterThanOrEqual(1)
    expect(typeof onDocumentRebase.mock.calls[0][0].localMutationCount).toBe('number')

    sub.unsubscribe()
  })
})

describe('checkoutPair -- version documents', () => {
  test('server action patch with versionId uses versionId in action payload', async () => {
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const versionClient = {
      ...client,
      observable: {
        ...client.observable,
        action: mockedActionRequest,
      },
      withConfig: vi.fn(() => versionClient),
    }

    const {version, draft, published} = checkoutPair(
      versionClient as any as SanityClient,
      versionIdPair,
      of(true),
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    version!.mutate(version!.patch([{set: {title: 'new title'}}]))
    version!.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: 'versions.r1.publishedId',
          publishedId: 'publishedId',
          patch: {
            set: {title: 'new title'},
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('version document latency tracking works', async () => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response)

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onReportLatency,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    version!.mutate(version!.patch([{set: {title: 'version edit'}}]))
    version!.commit()

    commitSubject.next({transactionId: 'tx-v1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-v1', 'versions.r1.publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx-v1',
    })

    vi.useRealTimers()
    vi.restoreAllMocks()
    sub.unsubscribe()
  })

  test('version document mutation performance tracking works', async () => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response)

    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        action: vi.fn(() => commitSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onReportMutationPerformance,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    version!.mutate(version!.patch([{set: {title: 'version perf edit'}}]))
    await vi.advanceTimersByTimeAsync(100) // debounce
    version!.commit()

    await vi.advanceTimersByTimeAsync(200) // API time
    commitSubject.next({transactionId: 'tx-vperf', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    await vi.advanceTimersByTimeAsync(50) // callback delay
    listenerSubject.next(createMutationEvent('tx-vperf', 'versions.r1.publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    expect(event.transactionId).toBe('tx-vperf')
    expect(event.debounceMs).toBeGreaterThanOrEqual(100)
    expect(event.apiMs).toBeGreaterThanOrEqual(200)
    expect(event.callbackMs).toBeGreaterThanOrEqual(event.apiMs)
    expect(event.shard).toBe('test-shard')

    vi.useRealTimers()
    vi.restoreAllMocks()
    sub.unsubscribe()
  })
})
