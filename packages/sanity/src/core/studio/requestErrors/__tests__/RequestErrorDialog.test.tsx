import {ChannelError} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {RequestErrorDialog} from '../RequestErrorDialog'

describe('RequestErrorDialog', () => {
  it('reports a listener that failed for good as a lost connection, with reload as the only way out', async () => {
    const TestProvider = await createTestProvider()
    const error = new ChannelError('Permission denied', {
      error: {type: 'permissionDeniedError', description: 'Permission denied'},
    })

    render(
      <TestProvider>
        <RequestErrorDialog
          claim={{type: 'listenerError', error, retryable: false}}
          onRetry={() => {}}
        />
      </TestProvider>,
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Connection error')
    expect(dialog).toHaveTextContent(
      "The Studio lost its live connection to Sanity and couldn't restore it. Content won't update live, and documents are read-only, until you reload the Studio.",
    )
    expect(screen.getByRole('link', {name: /Check Sanity Status/})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Reload Studio'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Try again'})).not.toBeInTheDocument()
  })
})
