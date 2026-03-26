import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('../feedbackClient', () => ({
  FEEDBACK_TUNNEL_URL: 'https://api.sanity.io/intake/feedback',
}))

import {useFeedbackAvailable} from '../hooks/useFeedbackAvailable'

describe('useFeedbackAvailable', () => {
  const dsn = 'https://key@sentry.sanity.io/123'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with null (pending)', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    const {result} = renderHook(() => useFeedbackAvailable(dsn))
    expect(result.current).toBeNull()
  })

  it('returns true when fetch resolves (tunnel reachable)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    const {result} = renderHook(() => useFeedbackAvailable(dsn))
    await act(async () => {})

    expect(result.current).toBe(true)
  })

  it('returns true even for non-ok status (no-cors resolves the promise)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 400}))

    const {result} = renderHook(() => useFeedbackAvailable(dsn))
    await act(async () => {})

    expect(result.current).toBe(true)
  })

  it('returns false when fetch rejects (network error / ad blocker)', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const {result} = renderHook(() => useFeedbackAvailable(dsn))
    await act(async () => {})

    expect(result.current).toBe(false)
  })

  it('sends a POST request with no-cors mode', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    renderHook(() => useFeedbackAvailable(dsn))
    await act(async () => {})

    expect(fetch).toHaveBeenCalledWith(
      'https://api.sanity.io/intake/feedback',
      expect.objectContaining({
        method: 'POST',
        mode: 'no-cors',
      }),
    )
  })

  it('includes the DSN and sent_at in the envelope body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    renderHook(() => useFeedbackAvailable(dsn))
    await act(async () => {})

    const call = vi.mocked(fetch).mock.calls[0]
    const body = (call[1] as RequestInit).body as string
    const parsed = JSON.parse(body.trim())
    expect(parsed.dsn).toBe(dsn)
    expect(parsed).toHaveProperty('sent_at')
  })

  it('re-checks when dsn changes', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    const {rerender} = renderHook(({d}) => useFeedbackAvailable(d), {
      initialProps: {d: dsn},
    })
    await act(async () => {})

    expect(fetch).toHaveBeenCalledTimes(1)

    rerender({d: 'https://other@sentry.sanity.io/456'})
    await act(async () => {})

    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
