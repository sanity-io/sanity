import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'

import {LazyActivity} from './LazyActivity'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button data-testid="counter" onClick={() => setCount((current) => current + 1)} type="button">
      {count}
    </button>
  )
}

describe('LazyActivity', () => {
  it('renders nothing until first shown', () => {
    render(
      <LazyActivity visible={false}>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.queryByTestId('content')).toBeNull()
  })

  it('renders children when visible', () => {
    render(
      <LazyActivity visible>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.getByTestId('content')).toBeVisible()
  })

  it('keeps children mounted but hidden after having been shown', () => {
    const {rerender} = render(
      <LazyActivity visible>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.getByTestId('content')).toBeVisible()

    rerender(
      <LazyActivity visible={false}>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.getByTestId('content')).not.toBeVisible()
  })

  it('preserves component state across hide and show', async () => {
    const {rerender} = render(
      <LazyActivity visible>
        <Counter />
      </LazyActivity>,
    )

    await userEvent.click(screen.getByTestId('counter'))
    expect(screen.getByTestId('counter')).toHaveTextContent('1')

    rerender(
      <LazyActivity visible={false}>
        <Counter />
      </LazyActivity>,
    )
    rerender(
      <LazyActivity visible>
        <Counter />
      </LazyActivity>,
    )

    expect(screen.getByTestId('counter')).toBeVisible()
    expect(screen.getByTestId('counter')).toHaveTextContent('1')
  })

  it('mounts children when becoming visible after starting hidden', () => {
    const {rerender} = render(
      <LazyActivity visible={false}>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.queryByTestId('content')).toBeNull()

    rerender(
      <LazyActivity visible>
        <div data-testid="content" />
      </LazyActivity>,
    )

    expect(screen.getByTestId('content')).toBeVisible()
  })
})
