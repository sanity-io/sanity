import {renderHook, waitFor} from '@testing-library/react'
import {of, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  getLocalUnclaimedProjectCopyUrl,
  parseUnclaimedProjectCopy,
  type UnclaimedProjectCopy,
  useUnclaimedProjectCopy,
} from '../useUnclaimedProjectCopy'

const {mockClient, mockRequest} = vi.hoisted(() => {
  const request = vi.fn()
  return {mockClient: {observable: {request}}, mockRequest: request}
})

vi.mock('../../../hooks/useClient', () => ({
  useClient: () => mockClient,
}))

const COPY: UnclaimedProjectCopy = {
  criticalThresholdHours: 8,
  snoozeMinutes: 30,
  banner: {
    text: 'Expires in {{timeLeft}} ({{expiresAt}}).',
    criticalText: 'Last call: expires in {{timeLeft}}.',
    claimButtonText: 'Claim project',
  },
  toast: {
    title: 'Expires in {{timeLeft}}.',
    criticalTitle: 'Last call: expires at {{expiresAt}}.',
    description: 'Keep everything you built.',
    claimButtonText: 'Claim project',
    snoozeButtonText: 'Remind me later',
  },
  noClaimUrl: {
    text: 'Open the claim link printed in your terminal.',
  },
}

describe('parseUnclaimedProjectCopy', () => {
  it('accepts the complete Journey contract', () => {
    expect(parseUnclaimedProjectCopy(COPY)).toEqual(COPY)
  })

  it('ignores legacy expired toast copy', () => {
    expect(
      parseUnclaimedProjectCopy({...COPY, expired: {toastTitle: 'This project expired.'}}),
    ).toEqual(COPY)
  })

  it.each([
    undefined,
    null,
    {},
    {...COPY, criticalThresholdHours: 0},
    {...COPY, snoozeMinutes: 1.5},
    {...COPY, banner: {...COPY.banner, text: undefined}},
    {...COPY, toast: {...COPY.toast, description: 42}},
    {...COPY, noClaimUrl: {text: null}},
  ])('rejects an incomplete or malformed contract', (value) => {
    expect(parseUnclaimedProjectCopy(value)).toBeUndefined()
  })
})

describe('getLocalUnclaimedProjectCopyUrl', () => {
  it.each([
    'http://localhost:5002/v2026-07-28/journey/unclaimed-project',
    'http://127.0.0.1:5002/v2026-07-28/journey/unclaimed-project',
    'http://[::1]:5002/v2026-07-28/journey/unclaimed-project',
  ])('allows a loopback HTTP endpoint during local development', (value) => {
    expect(getLocalUnclaimedProjectCopyUrl({isDev: true, value})).toBe(value)
  })

  it.each([
    ['a production build', false, 'http://localhost:5002/copy'],
    ['an HTTPS URL', true, 'https://localhost:5002/copy'],
    ['a non-loopback URL', true, 'http://example.com/copy'],
    ['a malformed URL', true, 'not-a-url'],
    ['a missing URL', true, undefined],
  ])('rejects %s', (_label, isDev, value) => {
    expect(getLocalUnclaimedProjectCopyUrl({isDev, value})).toBeUndefined()
  })
})

describe('useUnclaimedProjectCopy', () => {
  beforeEach(() => {
    mockRequest.mockReset()
    mockRequest.mockReturnValue(of(COPY))
  })

  it('does not request copy before mint-and-claim provenance is known', () => {
    const {result} = renderHook(() => useUnclaimedProjectCopy(false))

    expect(result.current).toBeUndefined()
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('returns Journey copy when the optional request succeeds', async () => {
    const {result} = renderHook(() => useUnclaimedProjectCopy(true))

    await waitFor(() => expect(result.current).toEqual(COPY))
    expect(mockRequest).toHaveBeenCalledExactlyOnceWith({
      uri: '/journey/unclaimed-project',
      tag: 'unclaimed-project-copy',
    })
  })

  it('stays quiet when the optional Journey request fails', async () => {
    mockRequest.mockReturnValue(throwError(() => new Error('Journey unavailable')))

    const {result} = renderHook(() => useUnclaimedProjectCopy(true))

    await waitFor(() =>
      expect(mockRequest).toHaveBeenCalledExactlyOnceWith({
        uri: '/journey/unclaimed-project',
        tag: 'unclaimed-project-copy',
      }),
    )
    expect(result.current).toBeUndefined()
  })
})
