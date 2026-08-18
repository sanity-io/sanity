import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {perspectiveContextValueMock} from '../../perspective/__mocks__/usePerspective.mock'
import {usePerspective} from '../../perspective/usePerspective'
import {scheduledRelease} from '../../releases/__fixtures__/release.fixture'
import {useSingleDocRelease} from '../context/SingleDocReleaseProvider'
import {useClearScheduledDraftPerspectiveOnDelete} from './useClearScheduledDraftPerspectiveOnDelete'

const mockOnSetScheduledDraftPerspective = vi.fn()

vi.mock('../context/SingleDocReleaseProvider', () => ({
  useSingleDocRelease: vi.fn(),
}))

vi.mock('../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

const mockUseSingleDocRelease = useSingleDocRelease as ReturnType<typeof vi.fn>
const mockUsePerspective = usePerspective as ReturnType<typeof vi.fn>

describe('useClearScheduledDraftPerspectiveOnDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSingleDocRelease.mockReturnValue({
      onSetScheduledDraftPerspective: mockOnSetScheduledDraftPerspective,
    })
    mockUsePerspective.mockReturnValue(perspectiveContextValueMock)
  })

  it('clears the scheduled draft perspective when viewing the deleted release', () => {
    mockUsePerspective.mockReturnValue({
      ...perspectiveContextValueMock,
      selectedPerspectiveName: 'rScheduled',
    })

    const {result} = renderHook(() => useClearScheduledDraftPerspectiveOnDelete(scheduledRelease))

    result.current()

    expect(mockOnSetScheduledDraftPerspective).toHaveBeenCalledWith('')
  })

  it('does not clear the perspective when not viewing the scheduled draft', () => {
    mockUsePerspective.mockReturnValue({
      ...perspectiveContextValueMock,
      selectedPerspectiveName: 'drafts',
    })

    const {result} = renderHook(() => useClearScheduledDraftPerspectiveOnDelete(scheduledRelease))

    result.current()

    expect(mockOnSetScheduledDraftPerspective).not.toHaveBeenCalled()
  })

  it('does nothing when release is undefined', () => {
    const {result} = renderHook(() => useClearScheduledDraftPerspectiveOnDelete(undefined))

    result.current()

    expect(mockOnSetScheduledDraftPerspective).not.toHaveBeenCalled()
  })
})
