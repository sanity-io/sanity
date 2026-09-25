import {act, cleanup, render} from '@testing-library/react'
import {Activity, useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useContentSize} from './useContentSize'

/** Records every observer the hook creates, and lets a test deliver sizes to it */
class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []
  observed: Element[] = []
  disconnected = false

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  observe(element: Element) {
    this.observed.push(element)
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true
  }

  resize(width: number, height: number) {
    const entry = {contentRect: {width, height}} as unknown as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

function Measured() {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const size = useContentSize(element)
  return (
    <div data-testid="measured" ref={setElement}>
      {size ? `${size.width}x${size.height}` : 'unmeasured'}
    </div>
  )
}

function harness(mode: 'visible' | 'hidden') {
  return (
    <Activity mode={mode}>
      <Measured />
    </Activity>
  )
}

describe('useContentSize', () => {
  beforeEach(() => {
    ResizeObserverMock.instances = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reports the observed content box and skips updates that change nothing', () => {
    const {getByTestId} = render(harness('visible'))
    const element = getByTestId('measured')
    expect(element.textContent).toBe('unmeasured')

    const [observer] = ResizeObserverMock.instances
    expect(observer.observed).toEqual([element])

    act(() => observer.resize(800, 600))
    expect(element.textContent).toBe('800x600')

    act(() => observer.resize(640, 600))
    expect(element.textContent).toBe('640x600')
  })

  it('observes again after a hidden Activity boundary shows the same element', () => {
    const {getByTestId, rerender} = render(harness('visible'))
    const element = getByTestId('measured')
    const [first] = ResizeObserverMock.instances
    act(() => first.resize(1440, 900))
    expect(element.textContent).toBe('1440x900')

    // Hiding runs the effect cleanup: the observer is dropped, the element and its state stay
    rerender(harness('hidden'))
    expect(first.disconnected).toBe(true)
    expect(ResizeObserverMock.instances).toHaveLength(1)

    // Showing runs the effect again on the very same DOM node, which must be observed afresh
    rerender(harness('visible'))
    expect(ResizeObserverMock.instances).toHaveLength(2)
    const [, second] = ResizeObserverMock.instances
    expect(second.observed).toEqual([element])
    expect(getByTestId('measured')).toBe(element)

    act(() => second.resize(820, 900))
    expect(element.textContent).toBe('820x900')
  })
})
