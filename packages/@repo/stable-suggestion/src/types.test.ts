import {afterEach, describe, expect, expectTypeOf, test, vi} from 'vitest'

import {DEFAULT_MODEL, getModel, MODEL_ENV_VAR, SHORTLIST_SIZE} from './config'
import {type Recommendation, type SlackRoute, type Sourced, type WebhookPayload} from './types'

describe('stable-suggestion types', () => {
  test('Sourced narrows on status', () => {
    const sourced = {status: 'ok', data: 1} as Sourced<number>
    if (sourced.status === 'ok') {
      expectTypeOf(sourced.data).toBeNumber()
    } else {
      expectTypeOf(sourced.error).toBeString()
    }
  })

  test('payload and route shapes are fixed', () => {
    expectTypeOf<WebhookPayload>().toEqualTypeOf<{text: string; run_url: string}>()
    expectTypeOf<SlackRoute>().toEqualTypeOf<'webhook-trigger' | 'incoming-webhook' | 'none'>()
    expectTypeOf<Recommendation['decision']>().toEqualTypeOf<'promote' | 'hold'>()
  })
})

describe('stable-suggestion config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('getModel falls back to the default', () => {
    vi.stubEnv(MODEL_ENV_VAR, '')
    expect(getModel()).toBe(DEFAULT_MODEL)
  })

  test('getModel honours the env override', () => {
    vi.stubEnv(MODEL_ENV_VAR, 'custom-model')
    expect(getModel()).toBe('custom-model')
  })

  test('shortlist size matches the candidate environments', () => {
    expect(SHORTLIST_SIZE).toBe(3)
  })
})
