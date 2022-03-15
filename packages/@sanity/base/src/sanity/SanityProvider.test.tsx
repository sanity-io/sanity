import {render, screen} from '@testing-library/react'
import React from 'react'
import {createConfig} from '../config'
import {useSource} from '../source'
import {SanityProvider} from './SanityProvider'

describe('SanityProvider', () => {
  it('should provide source in context', () => {
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

    function App() {
      const source = useSource()

      return <div data-testid={`source-${source.name}`} />
    }

    render(
      <SanityProvider config={config}>
        <App />
      </SanityProvider>
    )

    // screen.debug()

    expect(screen.getByTestId('source-default')).toBeInTheDocument()
  })
})
