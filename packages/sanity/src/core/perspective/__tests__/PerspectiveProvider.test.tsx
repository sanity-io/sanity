import {renderHook, waitFor} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {BehaviorSubject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {type VariantStoreState} from '../../variants/store/reducer'
import {PerspectiveProvider} from '../PerspectiveProvider'
import {usePerspective} from '../usePerspective'

const INITIAL_VARIANTS_STATE: VariantStoreState = {
  variants: new Map(),
  state: 'initialising',
}

const variantsState$ = new BehaviorSubject<VariantStoreState>({
  variants: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
  state: 'loaded',
})

vi.mock('../../variants/store/useVariantsStore', () => ({
  useVariantsStore: () => ({
    state$: variantsState$,
    initialState: INITIAL_VARIANTS_STATE,
    dispatch: vi.fn(),
  }),
}))

async function renderPerspective(selectedVariantName: string | undefined) {
  const TestProvider = await createTestProvider()

  function Wrapper({children}: PropsWithChildren) {
    return (
      <TestProvider>
        <PerspectiveProvider
          selectedPerspectiveName={undefined}
          selectedVariantName={selectedVariantName}
        >
          {children}
        </PerspectiveProvider>
      </TestProvider>
    )
  }

  return renderHook(() => usePerspective(), {wrapper: Wrapper})
}

describe('PerspectiveProvider variant sticky param', () => {
  it('reads variant:<id> as the short id', async () => {
    const {result} = await renderPerspective('variant:alpha-audience')

    expect(result.current.selectedVariantNames).toEqual(['alpha-audience'])
    // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
    expect(result.current.selectedVariantName).toBe('alpha-audience')
    await waitFor(() => {
      expect(result.current.selectedVariants[0]).toBe(variantAlphaAudience)
      // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
      expect(result.current.selectedVariant).toBe(variantAlphaAudience)
    })
  })

  it('reads a bare id as the variant type', async () => {
    const {result} = await renderPerspective('alpha-audience')

    expect(result.current.selectedVariantNames).toEqual(['alpha-audience'])
    // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
    expect(result.current.selectedVariantName).toBe('alpha-audience')
    await waitFor(() => {
      expect(result.current.selectedVariants[0]).toBe(variantAlphaAudience)
      // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
      expect(result.current.selectedVariant).toBe(variantAlphaAudience)
    })
  })

  it('reads every pair in the sticky param', async () => {
    const {result} = await renderPerspective('language:Fr12,variant:alpha-audience')

    expect(result.current.selectedVariantNames).toEqual(['Fr12', 'alpha-audience'])
    // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
    expect(result.current.selectedVariantName).toBe('Fr12')
    await waitFor(() => {
      expect(result.current.selectedVariants[1]).toBe(variantAlphaAudience)
    })
    expect(result.current.selectedVariants[0]).toBeUndefined()
    // oxlint-disable-next-line typescript/no-deprecated -- asserts the deprecated first-variant alias
    expect(result.current.selectedVariant).toBeUndefined()
  })
})
