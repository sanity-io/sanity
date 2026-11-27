import {act, cleanup, render} from '@testing-library/react'
import {Activity, type CSSProperties, useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {useContentSize} from './useContentSize'

/** Records every observer the hook creates, and lets a test deliver sizes to it */
class ResizeObserverMock implements ResizeObserver {
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
    const contentRect: DOMRectReadOnly = {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      width,
      height,
      right: width,
      bottom: height,
      toJSON: () => ({width, height}),
    }
    const size: ResizeObserverSize = {inlineSize: width, blockSize: height}
    const entry: ResizeObserverEntry = {
      target: this.observed[0],
      contentRect,
      contentBoxSize: [size],
      borderBoxSize: [size],
      devicePixelContentBoxSize: [size],
    }
    this.callback([entry], this)
  }
}

function Measured({style}: {style?: CSSProperties}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const size = useContentSize(element)
  return (
    <div data-testid="measured" ref={setElement} style={style}>
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

  it('measures a laid-out element before the browser paints, without waiting for the observer', () => {
    // jsdom lays nothing out, so give the element the box a browser would
    const box = {x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 600, width: 900, height: 600}
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      box,
    ] as unknown as DOMRectList)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      ...box,
      toJSON: () => box,
    })
    onTestFinished(() => {
      vi.restoreAllMocks()
    })

    const {getByTestId} = render(
      <Activity mode="visible">
        <Measured style={{padding: '10px 20px', border: '2px solid'}} />
      </Activity>,
    )

    // The layout effect has measured the content box: the border box less borders and padding
    expect(getByTestId('measured').textContent).toBe('856x576')
    expect(ResizeObserverMock.instances).toHaveLength(1)
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
