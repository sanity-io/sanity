import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {type Source} from '../../../config'
import {useSource} from '../../../studio/source'
import {useScheduledDraftsEnabled} from '../useScheduledDraftsEnabled'

vi.mock('../../../studio/source', () => ({
  useSource: vi.fn(),
}))

const useSourceMock = vi.mocked(useSource)

describe('useScheduledDraftsEnabled', () => {
  it('should return true when releases.scheduledDrafts.enabled is true', () => {
    useSourceMock.mockReturnValue({
      releases: {
        scheduledDrafts: {
          enabled: true,
        },
      },
    } as Partial<Source> as Source)

    const {result} = renderHook(useScheduledDraftsEnabled)
    expect(result.current).toBe(true)
  })

  it('should return false when releases.scheduledDrafts.enabled is false', () => {
    useSourceMock.mockReturnValue({
      releases: {
        scheduledDrafts: {
          enabled: false,
        },
      },
    } as Partial<Source> as Source)

    const {result} = renderHook(useScheduledDraftsEnabled)
    expect(result.current).toBe(false)
  })

  it('should return true when releases.scheduledDrafts.enabled is undefined (default)', () => {
    useSourceMock.mockReturnValue({
      releases: {
        scheduledDrafts: {},
      },
    } as Partial<Source> as Source)

    const {result} = renderHook(useScheduledDraftsEnabled)
    expect(result.current).toBe(true)
  })

  it('should return true when releases.scheduledDrafts is undefined (default)', () => {
    useSourceMock.mockReturnValue({
      releases: {},
    } as Partial<Source> as Source)

    const {result} = renderHook(useScheduledDraftsEnabled)
    expect(result.current).toBe(true)
  })

  it('should return true when releases is undefined (default)', () => {
    useSourceMock.mockReturnValue({} as Partial<Source> as Source)

    const {result} = renderHook(useScheduledDraftsEnabled)
    expect(result.current).toBe(true)
  })
})
