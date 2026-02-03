import {type SanityClient} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'

vi.mock('use-hot-module-reload', () => ({
  useHotModuleReload: vi.fn(),
}))

describe('FormBuilderInputErrorBoundary', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  it('renders children when there is no error', async () => {
    render(
      <FormBuilderInputErrorBoundary>
        <div data-testid="child">Child Component</div>
      </FormBuilderInputErrorBoundary>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('calls onUncaughtError when an error is caught', async () => {
    const onUncaughtError = vi.fn()

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    const client = createMockSanityClient() as unknown as SanityClient

    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        onUncaughtError,
      },
    })

    render(
      <TestProvider>
        <FormBuilderInputErrorBoundary>
          <ThrowErrorComponent />
        </FormBuilderInputErrorBoundary>
      </TestProvider>,
    )

    expect(onUncaughtError).toHaveBeenCalledTimes(1)
  })
})
