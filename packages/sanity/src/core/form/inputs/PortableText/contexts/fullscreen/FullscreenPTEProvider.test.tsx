import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useState} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {FullscreenPTEProvider} from './FullscreenPTEProvider'
import {useFullscreenPTE} from './useFullscreenPTE'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: vi.fn()}),
}))

function Reader() {
  const {getFullscreenPath, setFullscreenPath} = useFullscreenPTE()

  return (
    <>
      <button type="button" onClick={() => setFullscreenPath(['body'], true)}>
        open
      </button>
      <div data-testid="fullscreen-path">{getFullscreenPath(['body']) ?? ''}</div>
    </>
  )
}

function Harness() {
  const [childKey, setChildKey] = useState('a')

  return (
    <FullscreenPTEProvider>
      <button type="button" onClick={() => setChildKey('b')}>
        remount
      </button>
      <Reader key={childKey} />
    </FullscreenPTEProvider>
  )
}

describe('FullscreenPTEProvider', () => {
  it('keeps fullscreen paths when a child remounts under a stable provider', async () => {
    const wrapper = await createTestProvider()
    render(<Harness />, {wrapper})

    await userEvent.click(screen.getByRole('button', {name: 'open'}))
    expect(screen.getByTestId('fullscreen-path')).toHaveTextContent('body')

    await userEvent.click(screen.getByRole('button', {name: 'remount'}))
    expect(screen.getByTestId('fullscreen-path')).toHaveTextContent('body')
  })
})
