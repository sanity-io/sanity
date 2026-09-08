import {type ErrorEvent} from '@sentry/react'
import {describe, expect, test} from 'vitest'

import {beforeSend} from '../sentryErrorReporter'

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
