import {renderHook} from '@testing-library/react'
import {
  useGetDefaultPerspective,
  useSetPerspective,
  useSetVariant,
  useSingleDocRelease,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {usePerspectiveNavigator} from '../usePerspectiveNavigator'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useGetDefaultPerspective: vi.fn(),
  useSetPerspective: vi.fn(),
  useSetVariant: vi.fn(),
  useSingleDocRelease: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(),
}))

vi.mock('../../components/paneRouter/usePaneRouter')

const mockUseGetDefaultPerspective = useGetDefaultPerspective as Mock<
  typeof useGetDefaultPerspective
>
const mockUseSetPerspective = useSetPerspective as Mock<typeof useSetPerspective>
const mockUseSetVariant = useSetVariant as Mock<typeof useSetVariant>
const mockUseSingleDocRelease = useSingleDocRelease as Mock<typeof useSingleDocRelease>
const mockUseRouter = useRouter as Mock<() => Partial<ReturnType<typeof useRouter>>>
const mockUsePaneRouter = usePaneRouter as Mock<() => Partial<ReturnType<typeof usePaneRouter>>>

const LAPSED = '_.variants.lapsed'

const setGlobalVariant = vi.fn()
const setParams = vi.fn()

function renderNavigator(options: {
  params: Record<string, string | undefined>
  variantParam?: string
}) {
  mockUsePaneRouter.mockReturnValue({params: options.params, setParams})
  mockUseRouter.mockReturnValue({
    stickyParams: options.variantParam ? {variant: options.variantParam} : {},
  })
  return renderHook(() => usePerspectiveNavigator()).result.current
}

describe('usePerspectiveNavigator', () => {
  beforeEach(() => {
    mockUseGetDefaultPerspective.mockReturnValue('drafts')
    mockUseSetPerspective.mockReturnValue(vi.fn())
    mockUseSetVariant.mockReturnValue(setGlobalVariant)
    mockUseSingleDocRelease.mockReturnValue({onSetScheduledDraftPerspective: vi.fn()})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('setVariant', () => {
    it('only changes the global variant selection when no scheduled draft is open', () => {
      const {setVariant} = renderNavigator({params: {view: 'form'}})

      setVariant({variantId: LAPSED})

      expect(setGlobalVariant).toHaveBeenCalledWith({variantId: LAPSED})
      expect(setParams).not.toHaveBeenCalled()
    })

    it('closes the open scheduled draft in the same navigation that selects the variant', () => {
      const {setVariant} = renderNavigator({
        params: {view: 'form', scheduledDraft: 'rNovember'},
        variantParam: 'language:Fr12',
      })

      setVariant({variantId: LAPSED})

      expect(setGlobalVariant).not.toHaveBeenCalled()
      expect(setParams).toHaveBeenCalledTimes(1)
      expect(setParams).toHaveBeenCalledWith(
        {view: 'form', scheduledDraft: undefined},
        {variant: 'language:Fr12,variant:lapsed'},
      )
    })

    it('closes the open scheduled draft when going back to Default', () => {
      const {setVariant} = renderNavigator({
        params: {scheduledDraft: 'rNovember'},
        variantParam: 'variant:lapsed',
      })

      setVariant({variantId: undefined})

      expect(setParams).toHaveBeenCalledWith({scheduledDraft: undefined}, {variant: ''})
    })

    it('sets the perspective with the variant when one is given', () => {
      const {setVariant} = renderNavigator({params: {scheduledDraft: 'rNovember'}})

      setVariant({variantId: LAPSED, perspective: 'published'})

      expect(setParams).toHaveBeenCalledWith(
        {scheduledDraft: undefined},
        {variant: 'variant:lapsed', excludedPerspectives: '', perspective: 'published'},
      )
    })
  })
})
