import {act, renderHook, waitFor} from '@testing-library/react'
import {StrictMode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getAuthTokenStorageKey} from '../../../store/authStore/constants'
import {
  readUnclaimedProjectRecord,
  readUnclaimedProjectSnoozedAt,
  writeUnclaimedProjectRecord,
  writeUnclaimedProjectSnoozedAt,
} from '../../../store/authStore/unclaimedProjectStorage'
import {useUnclaimedProject} from '../useUnclaimedProject'

const {mockLogout, mockRequest, mockUseWorkspace} = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockRequest: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../workspace', () => ({useWorkspace: mockUseWorkspace}))
vi.mock('../../../hooks/useClient', () => {
  const client = {config: () => ({apiHost: 'https://api.sanity.io'}), request: mockRequest}
  return {useClient: () => client}
})
vi.mock('../../../util/supportsLocalStorage', () => ({supportsLocalStorage: true}))

const PROJECT_ID = 'test-project'
const CLAIM_URL = 'https://www.sanity.io/manage/claim/some-claim-token'
const CREATED_AT = '2026-07-24T00:00:00.000Z'
const TTL_MS = 72 * 3_600_000

const ROBOT_USER = {id: 'robot', provider: 'sanity-token'}
const HUMAN_USER = {id: 'human', provider: 'google'}

const mockFetch = vi.fn()

function lookupResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('useUnclaimedProject', () => {
  beforeEach(() => {
    localStorage.clear()
    mockLogout.mockResolvedValue(undefined)
    mockUseWorkspace.mockReturnValue({
      auth: {logout: mockLogout},
      currentUser: ROBOT_USER,
      projectId: PROJECT_ID,
    })
    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockResolvedValue(lookupResponse(429))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('stays quiet for a human session and clears any stale record', () => {
    mockUseWorkspace.mockReturnValue({currentUser: HUMAN_USER, projectId: PROJECT_ID})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})

    const {result} = renderHook(() => useUnclaimedProject())

    expect(result.current).toBeUndefined()
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('reports unclaimed with the stored claim URL when the org read says so', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {
      claimUrl: CLAIM_URL,
      expiresAt: '2026-07-27T00:00:00.000Z',
      lastLookupAt: new Date().toISOString(),
    })

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: CLAIM_URL,
        expiresAt: new Date('2026-07-27T00:00:00.000Z'),
        claimLinkSpent: false,
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('derives expiry from createdAt + 72h without a stored record, and never calls the lookup', async () => {
    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: undefined,
        expiresAt: new Date(new Date(CREATED_AT).getTime() + TTL_MS),
        claimLinkSpent: false,
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('reports claimed and cleans up when the project moved to a real organization', async () => {
    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    writeUnclaimedProjectSnoozedAt(PROJECT_ID, new Date().toISOString())

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current).toEqual({status: 'claimed'}))
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
    expect(readUnclaimedProjectSnoozedAt(PROJECT_ID)).toBeUndefined()
  })

  it('resolves the sole human project member for the claimed sign-in CTA', async () => {
    mockRequest.mockImplementation(({uri}: {uri: string}) => {
      if (uri === `/projects/${PROJECT_ID}`) {
        return Promise.resolve({
          createdAt: CREATED_AT,
          organizationId: 'oReal',
          members: [
            {id: 'robot', isRobot: true},
            {id: 'claimant', isRobot: false},
          ],
        })
      }
      if (uri === '/users/claimant') return Promise.resolve({email: 'claimant@example.com'})
      return Promise.reject(new Error(`Unexpected request: ${uri}`))
    })
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(result.current).toEqual({status: 'claimed', email: 'claimant@example.com'}),
    )
    expect(mockRequest).toHaveBeenCalledWith({
      tag: 'unclaimed-project.claimant',
      uri: '/users/claimant',
    })
  })

  it('keeps the generic claimed state when the claimant is ambiguous', async () => {
    mockRequest.mockResolvedValue({
      createdAt: CREATED_AT,
      organizationId: 'oReal',
      members: [
        {id: 'first-human', isRobot: false},
        {id: 'second-human', isRobot: false},
      ],
    })
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current).toEqual({status: 'claimed'}))
    expect(mockRequest).toHaveBeenCalledExactlyOnceWith({
      tag: 'unclaimed-project',
      uri: `/projects/${PROJECT_ID}`,
    })
  })

  it('stays quiet for a regular robot-token session on a claimed project', async () => {
    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(mockRequest).toHaveBeenCalledExactlyOnceWith({
        tag: 'unclaimed-project',
        uri: `/projects/${PROJECT_ID}`,
      }),
    )
    expect(result.current).toBeUndefined()
  })

  it('reports expired and logs out when the project is gone', async () => {
    mockRequest.mockRejectedValue({statusCode: 404})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    localStorage.setItem(getAuthTokenStorageKey(PROJECT_ID), JSON.stringify({token: 'sk-dead'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current).toEqual({status: 'expired'}))
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
    expect(localStorage.getItem(getAuthTokenStorageKey(PROJECT_ID))).toBeNull()
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('does not expire a regular robot-token session with no mint provenance', async () => {
    mockRequest.mockRejectedValue({statusCode: 404})
    localStorage.setItem(getAuthTokenStorageKey(PROJECT_ID), JSON.stringify({token: 'sk-live'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(localStorage.getItem(getAuthTokenStorageKey(PROJECT_ID))).not.toBeNull()
  })

  it('keeps mint credentials on a resource-level unauthorized response', async () => {
    mockRequest.mockRejectedValue({statusCode: 401})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    localStorage.setItem(getAuthTokenStorageKey(PROJECT_ID), JSON.stringify({token: 'sk-live'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual({claimUrl: CLAIM_URL})
    expect(localStorage.getItem(getAuthTokenStorageKey(PROJECT_ID))).not.toBeNull()
  })

  it('stays quiet when an unclaimed project has no usable creation time', async () => {
    mockRequest.mockResolvedValue({organizationId: 'oSystemUnclaimed'})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('looks up the authoritative expiry when a claim URL has no usable creation time', async () => {
    mockRequest.mockResolvedValue({organizationId: 'oSystemUnclaimed'})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    mockFetch.mockResolvedValue(
      lookupResponse(200, {state: 'claimable', expiresAt: '2026-07-26T18:00:00.000Z'}),
    )

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: CLAIM_URL,
        expiresAt: new Date('2026-07-26T18:00:00.000Z'),
        claimLinkSpent: false,
      }),
    )
    expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
      'https://api.sanity.io/v2026-06-23/provision/some-claim-token/lookup',
    )
  })

  it('treats a missing organization id as unverifiable, not as claimed', async () => {
    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: null})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual({claimUrl: CLAIM_URL})
  })

  it('stays quiet and keeps the record on a transient org read failure', async () => {
    mockRequest.mockRejectedValue({statusCode: 500})
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual({claimUrl: CLAIM_URL})
  })

  it('never expires on a transient failure, even past the recorded deadline', async () => {
    mockRequest.mockRejectedValue(new TypeError('network error'))
    const record = {claimUrl: CLAIM_URL, expiresAt: new Date(Date.now() - 60_000).toISOString()}
    writeUnclaimedProjectRecord(PROJECT_ID, record)
    localStorage.setItem(getAuthTokenStorageKey(PROJECT_ID), JSON.stringify({token: 'sk-live'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockRequest).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual(record)
    expect(localStorage.getItem(getAuthTokenStorageKey(PROJECT_ID))).not.toBeNull()
  })

  it('refines the expiry from the lookup and persists the throttle', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    mockFetch.mockResolvedValue(
      lookupResponse(200, {state: 'claimable', expiresAt: '2026-07-26T18:00:00.000Z'}),
    )

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: CLAIM_URL,
        expiresAt: new Date('2026-07-26T18:00:00.000Z'),
        claimLinkSpent: false,
      }),
    )
    expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
      'https://api.sanity.io/v2026-06-23/provision/some-claim-token/lookup',
    )
    const record = readUnclaimedProjectRecord(PROJECT_ID)
    expect(record?.expiresAt).toBe('2026-07-26T18:00:00.000Z')
    expect(record?.lastLookupAt).toBeDefined()
  })

  it('still refines via the lookup under Strict Mode double-mounting', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    mockFetch.mockResolvedValue(
      lookupResponse(200, {state: 'claimable', expiresAt: '2026-07-26T18:00:00.000Z'}),
    )

    const {result} = renderHook(() => useUnclaimedProject(), {wrapper: StrictMode})

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: CLAIM_URL,
        expiresAt: new Date('2026-07-26T18:00:00.000Z'),
        claimLinkSpent: false,
      }),
    )
    expect(readUnclaimedProjectRecord(PROJECT_ID)?.lastLookupAt).toBeDefined()
  })

  it('keeps the refined deadline after the claim link is retired', async () => {
    vi.useFakeTimers()
    try {
      const refined = new Date(Date.now() + 3_600_000).toISOString()
      writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL, expiresAt: refined})
      mockFetch.mockResolvedValue(lookupResponse(200, {state: 'expired'}))

      const {result} = renderHook(() => useUnclaimedProject())
      await act(() => vi.advanceTimersByTimeAsync(0))
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: undefined,
        expiresAt: new Date(refined),
        claimLinkSpent: true,
      })

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      await act(() => vi.advanceTimersByTimeAsync(5 * 60_000))
      expect(mockRequest).toHaveBeenCalledTimes(2)
      expect(result.current).toEqual({
        status: 'unclaimed',
        claimUrl: undefined,
        expiresAt: new Date(refined),
        claimLinkSpent: true,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('never calls the lookup with a claim token outside the base64url charset', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {
      claimUrl: 'https://www.sanity.io/manage/claim/a$b',
    })

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips the lookup inside the throttle window', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {
      claimUrl: CLAIM_URL,
      lastLookupAt: new Date(Date.now() - 60_000).toISOString(),
    })

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('flips to claimed when the lookup says the claim was spent', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    mockFetch.mockResolvedValue(lookupResponse(200, {state: 'claimed'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(result.current).toEqual({status: 'claimed'}))
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
  })

  it('keeps the countdown when the lookup is rate-limited', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    mockFetch.mockResolvedValue(lookupResponse(429))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(result.current?.status).toBe('unclaimed')
  })

  it('retires the claim link when the lookup says expired, but never the session', async () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    localStorage.setItem(getAuthTokenStorageKey(PROJECT_ID), JSON.stringify({token: 'sk-live'}))
    mockFetch.mockResolvedValue(lookupResponse(200, {state: 'expired'}))

    const {result} = renderHook(() => useUnclaimedProject())

    await waitFor(() => {
      expect(result.current?.status).toBe('unclaimed')
      expect(result.current?.status === 'unclaimed' && result.current.claimUrl).toBeUndefined()
    })
    expect(result.current?.status === 'unclaimed' && result.current.claimLinkSpent).toBe(true)
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
    expect(localStorage.getItem(getAuthTokenStorageKey(PROJECT_ID))).not.toBeNull()
  })

  it('schedules a follow-up check when focus lands inside the throttle window', async () => {
    vi.useFakeTimers()
    try {
      mockRequest
        .mockResolvedValueOnce({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
        .mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})

      const {result} = renderHook(() => useUnclaimedProject())
      await act(() => vi.advanceTimersByTimeAsync(0))
      expect(result.current?.status).toBe('unclaimed')

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      expect(mockRequest).toHaveBeenCalledTimes(1)

      await act(() => vi.advanceTimersByTimeAsync(5 * 60_000))
      expect(mockRequest).toHaveBeenCalledTimes(2)
      expect(result.current).toEqual({status: 'claimed'})
    } finally {
      vi.useRealTimers()
    }
  })

  it('polls project status after a claim attempt and stops once claimed', async () => {
    vi.useFakeTimers()
    try {
      mockRequest
        .mockResolvedValueOnce({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
        .mockResolvedValueOnce({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
        .mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})

      const initialProps: {claimAttemptedAt: number | undefined} = {claimAttemptedAt: undefined}
      const {result, rerender} = renderHook(
        ({claimAttemptedAt}: {claimAttemptedAt: number | undefined}) =>
          useUnclaimedProject({claimAttemptedAt}),
        {initialProps},
      )
      await act(() => vi.advanceTimersByTimeAsync(0))
      expect(result.current?.status).toBe('unclaimed')

      rerender({claimAttemptedAt: Date.now()})
      await act(() => vi.advanceTimersByTimeAsync(0))
      expect(mockRequest).toHaveBeenCalledTimes(2)

      await act(() => vi.advanceTimersByTimeAsync(10_000))
      expect(mockRequest).toHaveBeenCalledTimes(3)
      expect(result.current).toEqual({status: 'claimed'})

      await act(() => vi.advanceTimersByTimeAsync(30_000))
      expect(mockRequest).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('checks immediately on focus during a claim attempt', async () => {
    vi.useFakeTimers()
    try {
      mockRequest
        .mockResolvedValueOnce({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
        .mockResolvedValueOnce({createdAt: CREATED_AT, organizationId: 'oSystemUnclaimed'})
        .mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})

      const initialProps: {claimAttemptedAt: number | undefined} = {claimAttemptedAt: undefined}
      const {result, rerender} = renderHook(
        ({claimAttemptedAt}: {claimAttemptedAt: number | undefined}) =>
          useUnclaimedProject({claimAttemptedAt}),
        {initialProps},
      )
      await act(() => vi.advanceTimersByTimeAsync(0))

      rerender({claimAttemptedAt: Date.now()})
      await act(() => vi.advanceTimersByTimeAsync(0))
      expect(mockRequest).toHaveBeenCalledTimes(2)

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      await act(() => vi.advanceTimersByTimeAsync(0))

      expect(mockRequest).toHaveBeenCalledTimes(3)
      expect(result.current).toEqual({status: 'claimed'})
    } finally {
      vi.useRealTimers()
    }
  })

  it('resets state when the session stops being the robot', async () => {
    const {result, rerender} = renderHook(() => useUnclaimedProject())
    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))

    mockUseWorkspace.mockReturnValue({currentUser: HUMAN_USER, projectId: PROJECT_ID})
    rerender()

    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it('does not carry mint provenance across a robot to human to robot session change', async () => {
    const {result, rerender} = renderHook(() => useUnclaimedProject())
    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))

    mockUseWorkspace.mockReturnValue({currentUser: HUMAN_USER, projectId: PROJECT_ID})
    rerender()
    await waitFor(() => expect(result.current).toBeUndefined())

    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})
    mockUseWorkspace.mockReturnValue({currentUser: ROBOT_USER, projectId: PROJECT_ID})
    rerender()

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2))
    expect(result.current).toBeUndefined()
  })

  it('does not restore stale state after switching away from and back to a project', async () => {
    const {result, rerender} = renderHook(() => useUnclaimedProject())
    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))

    mockRequest.mockRejectedValue({statusCode: 500})
    mockUseWorkspace.mockReturnValue({currentUser: ROBOT_USER, projectId: 'other-project'})
    rerender()
    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2))
    expect(result.current).toBeUndefined()

    mockRequest.mockResolvedValue({createdAt: CREATED_AT, organizationId: 'oReal'})
    mockUseWorkspace.mockReturnValue({currentUser: ROBOT_USER, projectId: PROJECT_ID})
    rerender()

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(3))
    expect(result.current).toBeUndefined()
  })

  it('picks up a claim record stored by a mid-session hash paste', async () => {
    const {result} = renderHook(() => useUnclaimedProject())
    await waitFor(() => expect(result.current?.status).toBe('unclaimed'))
    expect(result.current?.status === 'unclaimed' && result.current.claimUrl).toBeUndefined()

    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    act(() => {
      window.dispatchEvent(new Event('hashchange'))
    })

    await waitFor(() =>
      expect(result.current?.status === 'unclaimed' && result.current.claimUrl).toBe(CLAIM_URL),
    )
  })
})
