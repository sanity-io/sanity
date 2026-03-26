import {type ConditionalPropertyCallbackContext} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {resolveConditionalPropertyState} from '../resolveConditionalProperty'

const getClient = vi.fn()

const DEFAULT_CONTEXT: ConditionalPropertyCallbackContext = {
  currentUser: null,
  document: {_id: 'test', _type: 'book'},
  getClient,
  parent: undefined,
  value: undefined,
  path: [],
}

describe('resolveConditionalPropertyState', () => {
  it('treats pending async hidden as hidden', async () => {
    const callback = vi.fn(() => Promise.resolve(true))

    const result = resolveConditionalPropertyState(callback, DEFAULT_CONTEXT, {
      checkPropertyName: 'hidden',
      pendingValue: true,
    })

    expect(result.value).toBe(true)
    expect(result.isPending).toBe(true)
    await expect(result.promise).resolves.toBe(true)
  })

  it('preserves sync boolean semantics', () => {
    expect(
      resolveConditionalPropertyState(true, DEFAULT_CONTEXT, {
        checkPropertyName: 'hidden',
        pendingValue: true,
      }),
    ).toEqual({value: true, isPending: false})

    expect(
      resolveConditionalPropertyState(false, DEFAULT_CONTEXT, {
        checkPropertyName: 'hidden',
        pendingValue: true,
      }),
    ).toEqual({value: false, isPending: false})
  })

  it('passes getClient through to callbacks', () => {
    const callback = vi.fn(({getClient: callbackGetClient}) => callbackGetClient === getClient)

    const result = resolveConditionalPropertyState(callback, DEFAULT_CONTEXT, {
      checkPropertyName: 'hidden',
      pendingValue: true,
    })

    expect(result).toEqual({value: true, isPending: false})
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({getClient}))
  })

  it('warns when callback returns undefined', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = resolveConditionalPropertyState(() => undefined as any, DEFAULT_CONTEXT, {
      checkPropertyName: 'hidden',
      pendingValue: true,
    })

    expect(result).toEqual({value: false, isPending: false})
    expect(consoleSpy).toHaveBeenCalledWith(
      'The `hidden` option is or returned `undefined`. `hidden` should return a boolean.',
    )
  })

  it('returns false when the callback throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = resolveConditionalPropertyState(
      () => {
        throw new Error('boom')
      },
      DEFAULT_CONTEXT,
      {
        checkPropertyName: 'hidden',
        pendingValue: true,
      },
    )

    expect(result).toEqual({value: false, isPending: false})
    expect(consoleSpy).toHaveBeenCalledWith(
      'An error occurred while running the callback from `hidden`: boom',
    )
  })
})
