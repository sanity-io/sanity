import {renderHook} from '@testing-library/react'
import {type PerspectiveContextValue} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {usePresentationPerspective} from '../usePresentationPerspective'

const mockUsePerspective = vi.fn()

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: () => mockUsePerspective(),
}))

describe('usePresentationPerspective', () => {
  beforeEach(() => {
    mockUsePerspective.mockReset()
  })

  it('should return `selectedPerspectiveName` when neither `selectedReleaseId` nor `scheduledDraft` is set', () => {
    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: 'drafts',
      selectedReleaseId: undefined,
      perspectiveStack: ['drafts'],
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationPerspective({scheduledDraft: undefined}))

    expect(result.current).toBe('drafts')
  })

  it('should return `perspectiveStack` when `selectedReleaseId` is set but `scheduledDraft` is undefined', () => {
    const perspectiveStack = ['rSomeRelease', 'drafts']
    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: 'drafts',
      selectedReleaseId: 'some-release-id',
      perspectiveStack,
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationPerspective({scheduledDraft: undefined}))

    // Should return the `perspectiveStack` without `undefined`
    expect(result.current).toEqual(perspectiveStack)
    expect(result.current).not.toContain(undefined)
  })

  it('should include `scheduledDraft` at the beginning when it is defined', () => {
    const perspectiveStack = ['rSomeRelease', 'drafts']
    const scheduledDraft = 'drafts.scheduled-doc-id'
    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: 'drafts',
      selectedReleaseId: 'some-release-id',
      perspectiveStack,
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationPerspective({scheduledDraft}))

    expect(result.current).toEqual([scheduledDraft, ...perspectiveStack])
  })

  it('should include `scheduledDraft` even when `selectedReleaseId` is not set', () => {
    const perspectiveStack = ['drafts']
    const scheduledDraft = 'drafts.scheduled-doc-id'
    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: 'drafts',
      selectedReleaseId: undefined,
      perspectiveStack,
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationPerspective({scheduledDraft}))

    expect(result.current).toEqual([scheduledDraft, ...perspectiveStack])
  })
})
