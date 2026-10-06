import {BrowserClient, type ErrorEvent, defaultStackParser, makeFetchTransport} from '@sentry/react'
import {describe, expect, test} from 'vitest'

import {beforeSend} from '../sentryErrorReporter'
import {scrubAutomaticPii, studioSentryDataCollection} from '../sentryPrivacy'

const UNHANDLED_REJECTION = 'auto.browser.global_handlers.onunhandledrejection'

function eventWith(
  exception: {type: string; value: string; mechanism?: string},
  tags?: Record<string, string>,
): ErrorEvent {
  return {
    type: undefined,
    tags,
    exception: {
      values: [
        {
          type: exception.type,
          value: exception.value,
          mechanism: {type: exception.mechanism ?? UNHANDLED_REJECTION, handled: true},
        },
      ],
    },
  }
}

describe('#beforeSend', () => {
  // The DOMException `AbortController.abort()` creates carries a stack, so Sentry types it
  // as `AbortError`. This is what `eventsource`'s `close()` produces.
  test('drops an abort typed as AbortError', () => {
    const event = eventWith(
      {type: 'AbortError', value: 'signal is aborted without reason'},
      {'DOMException.code': '20'},
    )
    expect(beforeSend(event)).toBeNull()
  })

  // A DOMException without a stack gets flattened into `Error`, with the name folded into
  // the value. Same abort, different shape.
  test('drops an abort flattened into Error', () => {
    const event = eventWith(
      {type: 'Error', value: 'AbortError: The user aborted a request.'},
      {'DOMException.code': '20'},
    )
    expect(beforeSend(event)).toBeNull()
  })

  test('drops an abort even without the DOMException.code tag', () => {
    const event = eventWith({type: 'AbortError', value: 'Fetch is aborted'})
    expect(beforeSend(event)).toBeNull()
  })

  // Studios on older releases ship Sentry v8, which named the mechanism without a prefix.
  test('drops an abort reported by the older SDK mechanism name', () => {
    const event = eventWith(
      {
        type: 'AbortError',
        value: 'signal is aborted without reason',
        mechanism: 'onunhandledrejection',
      },
      {'DOMException.code': '20'},
    )
    expect(beforeSend(event)).toBeNull()
  })

  // `linkedErrors` splits a cause chain across entries, so the mechanism is not always first.
  test('drops an abort where the mechanism is on a later exception value', () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {type: 'Error', value: 'some underlying cause', mechanism: {type: 'chained'}},
          {
            type: 'AbortError',
            value: 'signal is aborted without reason',
            mechanism: {type: UNHANDLED_REJECTION},
          },
        ],
      },
    }
    expect(beforeSend(event)).toBeNull()
  })

  test('keeps an abort that did not come from an unhandled rejection', () => {
    const event = eventWith(
      {type: 'AbortError', value: 'signal is aborted without reason', mechanism: 'generic'},
      {'DOMException.code': '20'},
    )
    expect(beforeSend(event)).not.toBeNull()
  })

  test('keeps an unrelated unhandled rejection', () => {
    const event = eventWith({type: 'TypeError', value: 'Failed to fetch'})
    expect(beforeSend(event)).not.toBeNull()
  })

  test('marks kept errors as unhandled and scrubs pii', () => {
    const event = eventWith({type: 'TypeError', value: 'Failed to fetch'})
    const sent = beforeSend(event)

    expect(sent?.exception?.values?.[0]?.mechanism?.handled).toBe(false)
    expect(sent?.user).toEqual({ip_address: '0.0.0.0'})
    expect(sent?.request).toBeUndefined()
  })
})

describe('sentry v11 data collection', () => {
  test('keeps relay from inferring the client ip', () => {
    const client = new BrowserClient({
      dsn: 'https://public@sentry.example.com/1',
      stackParser: defaultStackParser,
      transport: makeFetchTransport,
      dataCollection: studioSentryDataCollection,
      integrations: [],
    })

    expect(client.getDataCollectionOptions().userInfo).toBe(false)
    expect(client.getDataCollectionOptions().cookies).toBe(false)
    expect(client.getDataCollectionOptions().httpBodies).toEqual([])
    expect(client.getSdkMetadata()?.sdk?.settings?.infer_ip).toBe('never')
  })

  test('keeps the v10 opt-out for every category v11 collects by default', () => {
    expect(studioSentryDataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: {deny: ['forwarded', '-ip', 'remote-', 'via', '-user']},
        response: {deny: ['forwarded', '-ip', 'remote-', 'via', '-user']},
      },
      httpBodies: [],
      urlQueryParams: {deny: ['forwarded', '-ip', 'remote-', 'via', '-user']},
      genAI: {inputs: false, outputs: false},
      databaseQueryData: false,
      graphQL: {document: false, variables: false},
      queues: false,
    })
  })

  test('scrubs automatic user and request data without touching feedback fields', () => {
    const event: ErrorEvent = {
      type: undefined,
      user: {email: 'person@example.com', ip_address: '203.0.113.5'},
      request: {
        url: 'https://studio.example/desk?token=secret',
        headers: {'Cookie': 'sid=abc', 'User-Agent': 'test'},
      },
      contexts: {
        feedback: {contactEmail: 'kept@example.com', message: 'hello'},
      },
      tags: {contactEmail: 'kept@example.com'},
    }

    const scrubbed = scrubAutomaticPii(event)

    expect(scrubbed.user).toEqual({ip_address: '0.0.0.0'})
    expect(scrubbed.request).toBeUndefined()
    expect(scrubbed.contexts?.feedback).toEqual({
      contactEmail: 'kept@example.com',
      message: 'hello',
    })
    expect(scrubbed.tags).toEqual({contactEmail: 'kept@example.com'})
  })
})
