import {render, screen} from '@testing-library/react'
import React from 'react'
import {createMockSanityClient} from '../../test/mocks/mockSanityClient'
import {createConfig} from '../config'
import {SanityProvider} from '../sanity'
import {useClient} from './useClient'

const useClientMock = useClient as jest.Mock

jest.mock('./useClient')

describe('useClient', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should mock the client', () => {
    const mockClient = createMockSanityClient()

    useClientMock.mockImplementation(() => mockClient)

    function App() {
      const client = useClient()

      return <div data-testid={`client-${client.config().projectId}`} />
    }

    const config = createConfig({
      sources: [
        {
          name: 'default',
          title: 'Default',
          projectId: 'foo',
          dataset: 'test',
          schemaTypes: [],
        },
      ],
    })

    render(
      <SanityProvider config={config}>
        <App />
      </SanityProvider>
    )

    expect(useClientMock).toHaveBeenCalledTimes(4)

    expect(screen.getByTestId('client-mock-project-id')).toBeInTheDocument()
  })
})
