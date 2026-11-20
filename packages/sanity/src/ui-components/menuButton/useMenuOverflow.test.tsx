import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useMenuOverflow} from './useMenuOverflow'

function Probe({items}: {items: number}) {
  const ref = useMenuOverflow()

  return (
    <div data-testid="scroller" ref={ref}>
      {Array.from({length: items}, (_, index) => (
        <div key={index} />
      ))}
    </div>
  )
}

function setSize(element: HTMLElement, size: {clientHeight: number; scrollHeight: number}) {
  Object.defineProperty(element, 'clientHeight', {configurable: true, value: size.clientHeight})
  Object.defineProperty(element, 'scrollHeight', {configurable: true, value: size.scrollHeight})
}

describe('useMenuOverflow', () => {
  let resizeCallbacks: ResizeObserverCallback[] = []
  const observed: Element[] = []

  beforeEach(() => {
    resizeCallbacks = []
    observed.length = 0
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback)
        }
        observe(element: Element) {
          observed.push(element)
        }
        disconnect() {}
        unobserve() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function resize() {
    await act(async () => {
      for (const callback of resizeCallbacks) callback([], {} as ResizeObserver)
    })
  }

  it('does not mark a list that fits', () => {
    render(<Probe items={2} />)

    expect(screen.getByTestId('scroller')).not.toHaveAttribute('data-overflowing')
  })

  it('marks the scroller once its content grows taller than it, and clears it when it fits again', async () => {
    render(<Probe items={2} />)
    const scroller = screen.getByTestId('scroller')

    setSize(scroller, {clientHeight: 100, scrollHeight: 240})
    await resize()
    expect(scroller).toHaveAttribute('data-overflowing')

    setSize(scroller, {clientHeight: 100, scrollHeight: 100})
    await resize()
    expect(scroller).not.toHaveAttribute('data-overflowing')
  })

  it('observes the scroller and its children, and re-observes when the children change', async () => {
    const {rerender} = render(<Probe items={2} />)
    const scroller = screen.getByTestId('scroller')

    expect(observed).toContain(scroller)
    expect(observed).toHaveLength(3)

    observed.length = 0
    rerender(<Probe items={3} />)
    await act(async () => {
      await Promise.resolve()
    })

    expect(observed).toHaveLength(4)
  })

  it('removes the attribute on unmount', () => {
    const {unmount} = render(<Probe items={1} />)
    const scroller = screen.getByTestId('scroller')
    scroller.setAttribute('data-overflowing', '')

    unmount()

    expect(scroller).not.toHaveAttribute('data-overflowing')
  })
})
