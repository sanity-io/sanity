import {renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeedbackAvailable} from '../hooks/useFeedbackAvailable'

vi.mock('../feedbackClient', () => ({
  FEEDBACK_TUNNEL_URL: 'https://api.sanity.io/intake/feedback',
}))

describe('useFeedbackAvailable', () => {
  const dsn = 'https://key@sentry.sanity.io/123'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with null (pending)', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => undefined))
    const {result} = renderHook(() => useFeedbackAvailable({dsn}))
    expect(result.current).toBeNull()
  })

  it('returns true when tunnel responds with 200', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    const {result} = renderHook(() => useFeedbackAvailable({dsn}))
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns false when tunnel responds with non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 400}))

    const {result} = renderHook(() => useFeedbackAvailable({dsn}))
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('returns false when fetch rejects (network error / ad blocker)', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const {result} = renderHook(() => useFeedbackAvailable({dsn}))
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('sends a POST request to the tunnel URL', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    renderHook(() => useFeedbackAvailable({dsn}))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    const call = vi.mocked(fetch).mock.calls[0]
    const options = call[1] as RequestInit
    expect(call[0]).toBe('https://api.sanity.io/intake/feedback')
    expect(options.method).toBe('POST')
  })

  it('includes the DSN and sent_at in the envelope body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    renderHook(() => useFeedbackAvailable({dsn}))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    const call = vi.mocked(fetch).mock.calls[0]
    const body = (call[1] as RequestInit).body as string
    const parsed = JSON.parse(body.trim())
    expect(parsed.dsn).toBe(dsn)
    expect(parsed).toHaveProperty('sent_at')
  })

  it('re-checks when dsn changes', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))

    const {rerender} = renderHook(({d}) => useFeedbackAvailable({dsn: d}), {
      initialProps: {d: dsn},
    })
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    rerender({d: 'https://other@sentry.sanity.io/456'})
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('returns false immediately when skip is true', () => {
    const {result} = renderHook(() => useFeedbackAvailable({dsn, skip: true}))
    expect(result.current).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fires fetch when skip changes from true to false', async () => {
    const {result, rerender} = renderHook(({opts}) => useFeedbackAvailable(opts), {
      initialProps: {opts: {dsn, skip: true}},
    })
    expect(result.current).toBe(false)
    expect(fetch).not.toHaveBeenCalled()

    vi.mocked(fetch).mockResolvedValue(new Response(null, {status: 200}))
    rerender({opts: {dsn, skip: false}})
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
