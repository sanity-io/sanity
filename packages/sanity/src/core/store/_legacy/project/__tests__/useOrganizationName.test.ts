import {renderHook, waitFor} from '@testing-library/react'
import {type Observable, of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useClient} from '../../../../hooks'
import {useOrganizationName} from '../useOrganizationName'

vi.mock('../../../../hooks', () => ({
  useClient: vi.fn(),
}))

function mockClient(response$: Observable<{name?: string}>) {
  vi.mocked(useClient).mockReturnValue({
    observable: {
      request: vi.fn().mockReturnValue(response$),
    },
  } as never)
}

describe('useOrganizationName', () => {
  beforeEach(() => {
    mockClient(of({name: 'Sanity Inc'}))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty string initially when orgId is null', () => {
    const {result} = renderHook(() => useOrganizationName(null))
    expect(result.current).toBe('')
  })

  it('does not make a request when orgId is null', () => {
    const client = {observable: {request: vi.fn()}} as never
    vi.mocked(useClient).mockReturnValue(client)

    renderHook(() => useOrganizationName(null))
    expect(
      (client as {observable: {request: ReturnType<typeof vi.fn>}}).observable.request,
    ).not.toHaveBeenCalled()
  })

  it('fetches and returns the organization name', async () => {
    const {result} = renderHook(() => useOrganizationName('org-123'))

    await waitFor(() => {
      expect(result.current).toBe('Sanity Inc')
    })
  })

  it('calls the correct API endpoint', () => {
    const request = vi.fn().mockReturnValue(of({name: 'Test Org'}))
    vi.mocked(useClient).mockReturnValue({observable: {request}} as never)

    renderHook(() => useOrganizationName('org-456'))

    expect(request).toHaveBeenCalledWith({
      url: '/organizations/org-456',
      tag: 'get-org-name',
    })
  })

  it('returns empty string when the API returns no name', async () => {
    mockClient(of({}))

    const {result} = renderHook(() => useOrganizationName('org-123'))

    await waitFor(() => {
      expect(result.current).toBe('')
    })
  })

  it('returns empty string on API error', async () => {
    mockClient(throwError(() => new Error('Network error')))

    const {result} = renderHook(() => useOrganizationName('org-123'))

    await waitFor(() => {
      expect(result.current).toBe('')
    })
  })

  it('refetches when orgId changes', async () => {
    const request = vi
      .fn()
      .mockReturnValueOnce(of({name: 'Org A'}))
      .mockReturnValueOnce(of({name: 'Org B'}))
    vi.mocked(useClient).mockReturnValue({observable: {request}} as never)

    const {result, rerender} = renderHook(({id}) => useOrganizationName(id), {
      initialProps: {id: 'org-a' as string | null},
    })

    await waitFor(() => {
      expect(result.current).toBe('Org A')
    })

    rerender({id: 'org-b'})

    await waitFor(() => {
      expect(result.current).toBe('Org B')
    })
    expect(request).toHaveBeenCalledTimes(2)
  })
})
