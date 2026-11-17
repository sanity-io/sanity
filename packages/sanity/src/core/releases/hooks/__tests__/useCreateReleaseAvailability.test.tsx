import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../store/__tests__/__mocks/useActiveReleases.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../store/__tests__/__mocks/useReleasePermissions.mock'
import {useCreateReleaseAvailability} from '../useCreateReleaseAvailability'

vi.mock('../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

async function renderAvailability(limit?: number) {
  const wrapper = await createTestProvider({config: {releases: {limit}}})
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- flushes the permission check's state update inside act
  return act(async () => renderHook(() => useCreateReleaseAvailability(), {wrapper}))
}

describe('useCreateReleaseAvailability', () => {
  beforeEach(() => {
    mockUseActiveReleases.mockReturnValue({
      ...useActiveReleasesMockReturn,
      data: [activeASAPRelease, activeScheduledRelease],
    })
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
  })

  it('is loading and disabled without a tooltip until the permission check settles', async () => {
    mockUseReleasePermissions.mockReturnValue({
      ...useReleasePermissionsMockReturn,
      checkWithPermissionGuard: vi.fn(() => new Promise<boolean>(() => {})),
    })

    const {result} = await renderAvailability()

    expect(result.current).toEqual({status: 'loading', disabled: true, tooltip: undefined})
  })

  it('is allowed when the user has permission and no limit is configured', async () => {
    const {result} = await renderAvailability()

    await waitFor(() =>
      expect(result.current).toEqual({status: 'allowed', disabled: false, tooltip: undefined}),
    )
  })

  it('is allowed while the active releases stay below the workspace limit', async () => {
    const {result} = await renderAvailability(3)

    await waitFor(() => expect(result.current.status).toBe('allowed'))
  })

  it('explains a missing permission', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)

    const {result} = await renderAvailability()

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'no-permission',
        disabled: true,
        tooltip: 'You do not have permission to perform this action',
      }),
    )
  })

  it('explains the workspace limit once the active releases reach it', async () => {
    const {result} = await renderAvailability(2)

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'limit-reached',
        disabled: true,
        tooltip: 'This workspace is limited to 2 releases',
      }),
    )
  })

  it('reports the workspace limit while the permission check is pending', async () => {
    mockUseReleasePermissions.mockReturnValue({
      ...useReleasePermissionsMockReturn,
      checkWithPermissionGuard: vi.fn(() => new Promise<boolean>(() => {})),
    })

    const {result} = await renderAvailability(2)

    expect(result.current).toEqual({
      status: 'limit-reached',
      disabled: true,
      tooltip: 'This workspace is limited to 2 releases',
    })
  })

  it('is loading while the active releases load under a workspace limit', async () => {
    mockUseActiveReleases.mockReturnValue({...useActiveReleasesMockReturn, loading: true})

    const {result} = await renderAvailability(2)

    expect(result.current).toEqual({status: 'loading', disabled: true, tooltip: undefined})
  })

  it('ignores loading active releases when no workspace limit is configured', async () => {
    mockUseActiveReleases.mockReturnValue({...useActiveReleasesMockReturn, loading: true})

    const {result} = await renderAvailability()

    await waitFor(() => expect(result.current.status).toBe('allowed'))
  })

  it('reports the workspace limit ahead of a missing permission', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)

    const {result} = await renderAvailability(1)

    await waitFor(() => expect(result.current.status).toBe('limit-reached'))
  })
})
