/**
 * Uses synthetic lazy components, not the real StudioImageInputLazy: `act()`
 * drains the microtask queue on render and Vitest resolves mocked `import()` on
 * a microtask, so the shim's pending state is never observable. The synthetic
 * components exercise the same contract — lazy() under Suspense, inside the error
 * boundary.
 */
import {type SanityClient} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {lazy, Suspense, type ComponentType, type PropsWithChildren} from 'react'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {FormBuilderInputErrorBoundary} from '../FormBuilderInputErrorBoundary'

vi.mock('use-hot-module-reload', () => ({
  useHotModuleReload: vi.fn(),
}))

// Stub both the concrete and barrel paths so the fallback needs no ThemeProvider;
// the data-testid matches the real component.
vi.mock('../../../components/loadingBlock/LoadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))
vi.mock('../../../components/loadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

const NeverResolvingComponent = lazy(() => new Promise<{default: () => null}>(() => {}))

const RejectingComponent = lazy(() =>
  Promise.reject<{default: () => null}>(new Error('chunk failed to load')),
)

describe('lazy shim — pending fallback', () => {
  it('shows LoadingBlock while the lazy import has not resolved', () => {
    render(
      <Suspense fallback={<LoadingBlock />}>
        <NeverResolvingComponent />
      </Suspense>,
    )

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
  })
})

describe('lazy shim — rejection path', () => {
  let TestProvider: ComponentType<PropsWithChildren>

  beforeAll(async () => {
    const client = createMockSanityClient() as unknown as SanityClient
    TestProvider = await createTestProvider({
      client,
      config: {name: 'default', projectId: 'test', dataset: 'test'},
    })
  })

  it('is caught by FormBuilderInputErrorBoundary instead of propagating', async () => {
    // Suppress the expected error-boundary console.error noise.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestProvider>
        <FormBuilderInputErrorBoundary>
          <Suspense fallback={<LoadingBlock />}>
            <RejectingComponent />
          </Suspense>
        </FormBuilderInputErrorBoundary>
      </TestProvider>,
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    })
  })
})
