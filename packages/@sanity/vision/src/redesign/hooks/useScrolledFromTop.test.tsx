import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {useScrolledFromTop} from './useScrolledFromTop'

function Pane({contentKey = 'a', mounted = true}: {contentKey?: string; mounted?: boolean}) {
  const {scrolled, setScroller} = useScrolledFromTop()
  return (
    <div>
      <div data-scrolled={scrolled} data-testid="toolbar" />
      {mounted ? (
        <div key={contentKey} ref={setScroller}>
          <div data-testid="scroller">
            <div data-testid="sideways" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** jsdom lays nothing out, so the scroll geometry is set on the element itself */
function setScroll(element: HTMLElement, geometry: {top: number; height: number; client: number}) {
  Object.defineProperty(element, 'scrollTop', {configurable: true, value: geometry.top})
  Object.defineProperty(element, 'scrollHeight', {configurable: true, value: geometry.height})
  Object.defineProperty(element, 'clientHeight', {configurable: true, value: geometry.client})
  fireEvent.scroll(element)
}

const toolbar = () => screen.getByTestId('toolbar').dataset.scrolled

describe('useScrolledFromTop', () => {
  afterEach(cleanup)

  it('is scrolled while a descendant scroller is away from its top', () => {
    render(<Pane />)
    expect(toolbar()).toBe('false')

    setScroll(screen.getByTestId('scroller'), {top: 40, height: 500, client: 100})
    expect(toolbar()).toBe('true')

    setScroll(screen.getByTestId('scroller'), {top: 0, height: 500, client: 100})
    expect(toolbar()).toBe('false')
  })

  it('ignores elements that only scroll sideways', () => {
    render(<Pane />)
    setScroll(screen.getByTestId('scroller'), {top: 40, height: 500, client: 100})

    setScroll(screen.getByTestId('sideways'), {top: 0, height: 20, client: 20})
    expect(toolbar()).toBe('true')
  })

  it('follows the scroller back to its top once its content stops overflowing', () => {
    render(<Pane />)
    setScroll(screen.getByTestId('scroller'), {top: 40, height: 500, client: 100})

    setScroll(screen.getByTestId('scroller'), {top: 0, height: 100, client: 100})
    expect(toolbar()).toBe('false')
  })

  it('starts at the top again when the scroller is replaced for other content', () => {
    const {rerender} = render(<Pane contentKey="json" />)
    setScroll(screen.getByTestId('scroller'), {top: 40, height: 500, client: 100})
    expect(toolbar()).toBe('true')

    rerender(<Pane contentKey="graph" />)
    expect(toolbar()).toBe('false')
  })

  it('clears the border when the scroller unmounts, and stays clear when it returns', () => {
    const {rerender} = render(<Pane />)
    setScroll(screen.getByTestId('scroller'), {top: 40, height: 500, client: 100})
    expect(toolbar()).toBe('true')

    rerender(<Pane mounted={false} />)
    expect(toolbar()).toBe('false')

    rerender(<Pane />)
    expect(toolbar()).toBe('false')
  })
})
