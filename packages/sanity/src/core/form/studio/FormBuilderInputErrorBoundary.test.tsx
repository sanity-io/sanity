import {beforeAll, describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'
import {type SanityClient} from 'sanity'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {FormBuilderInputErrorBoundary} from './FormBuilderInputErrorBoundary'

jest.mock('use-hot-module-reload', () => ({
  useHotModuleReload: jest.fn(),
}))

describe('FormBuilderInputErrorBoundary', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', async () => {
    render(
      <FormBuilderInputErrorBoundary>
        <div data-testid="child">Child Component</div>
      </FormBuilderInputErrorBoundary>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('calls onStudioError when an error is caught', async () => {
    const onStudioError = jest.fn()

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
        onStudioError,
      },
    })

    render(
      <TestProvider>
        <FormBuilderInputErrorBoundary>
          <ThrowErrorComponent />
        </FormBuilderInputErrorBoundary>
      </TestProvider>,
    )

    expect(onStudioError).toHaveBeenCalledTimes(1)
  })
})
