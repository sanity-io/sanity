import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useMenuOverflow} from './useMenuOverflow'

function Probe() {
  const {scrollerRef} = useMenuOverflow()

  return (
    <div data-testid="scroller" ref={scrollerRef}>
      <div />
    </div>
  )
}

function setSize(
  element: HTMLElement,
  size: {clientHeight: number; scrollHeight: number; scrollTop?: number},
) {
  Object.defineProperty(element, 'clientHeight', {configurable: true, value: size.clientHeight})
  Object.defineProperty(element, 'scrollHeight', {configurable: true, value: size.scrollHeight})
  element.scrollTop = size.scrollTop ?? 0
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

  it('marks no edge of a list that fits', () => {
    render(<Probe />)
    const scroller = screen.getByTestId('scroller')

    expect(scroller).not.toHaveAttribute('data-scroll-up')
    expect(scroller).not.toHaveAttribute('data-scroll-down')
  })

  it('observes the scroller and its child', () => {
    render(<Probe />)
    const scroller = screen.getByTestId('scroller')

    expect(observed).toEqual([scroller, scroller.firstElementChild])
  })

  it('marks the bottom edge once the contents grow taller than the list, and clears it when they fit', async () => {
    render(<Probe />)
    const scroller = screen.getByTestId('scroller')

    setSize(scroller, {clientHeight: 100, scrollHeight: 240})
    await resize()
    expect(scroller).toHaveAttribute('data-scroll-down')
    expect(scroller).not.toHaveAttribute('data-scroll-up')

    setSize(scroller, {clientHeight: 100, scrollHeight: 100})
    await resize()
    expect(scroller).not.toHaveAttribute('data-scroll-down')
  })

  it('marks the edges with rows beyond them as the list scrolls', () => {
    render(<Probe />)
    const scroller = screen.getByTestId('scroller')

    setSize(scroller, {clientHeight: 100, scrollHeight: 240, scrollTop: 60})
    fireEvent.scroll(scroller)
    expect(scroller).toHaveAttribute('data-scroll-up')
    expect(scroller).toHaveAttribute('data-scroll-down')

    setSize(scroller, {clientHeight: 100, scrollHeight: 240, scrollTop: 140})
    fireEvent.scroll(scroller)
    expect(scroller).toHaveAttribute('data-scroll-up')
    expect(scroller).not.toHaveAttribute('data-scroll-down')
  })

  it('removes the attributes on unmount', async () => {
    const {unmount} = render(<Probe />)
    const scroller = screen.getByTestId('scroller')
    setSize(scroller, {clientHeight: 100, scrollHeight: 240, scrollTop: 60})
    await resize()

    unmount()

    expect(scroller).not.toHaveAttribute('data-scroll-up')
    expect(scroller).not.toHaveAttribute('data-scroll-down')
  })
})
