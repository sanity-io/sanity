import {Text, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, render, waitFor} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useIsTextTruncated} from './useIsTextTruncated'

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = []
  observed: Element[] = []

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  observe(element: Element) {
    this.observed.push(element)
  }

  unobserve() {}

  disconnect() {}

  trigger() {
    this.callback([], this)
  }
}

/** jsdom lays nothing out: every span reports this content width inside a box of `clientWidth` */
let layout = {scrollWidth: 0, clientWidth: 0}
const theme = buildTheme()

function Title({title}: {title: string}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const truncated = useIsTextTruncated(element)
  return (
    <ThemeProvider theme={theme}>
      <Text ref={setElement} textOverflow="ellipsis">
        {title}
      </Text>
      <output data-testid="truncated">{String(truncated)}</output>
    </ThemeProvider>
  )
}

describe('useIsTextTruncated', () => {
  beforeEach(() => {
    ResizeObserverMock.instances = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    // @sanity/ui's ThemeProvider reads the color scheme preference
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: false,
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      () => layout.scrollWidth,
    )
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      () => layout.clientWidth,
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports a title that fits as not truncated', () => {
    layout = {scrollWidth: 80, clientWidth: 120}
    const {getByTestId} = render(<Title title="Short" />)
    expect(getByTestId('truncated').textContent).toBe('false')
  })

  it('follows the clipping span as it resizes', () => {
    layout = {scrollWidth: 200, clientWidth: 120}
    const {getByTestId} = render(<Title title="A title too long for its tab" />)
    expect(getByTestId('truncated').textContent).toBe('true')

    const [observer] = ResizeObserverMock.instances
    // The innermost span, which draws the ellipsis
    const [clip] = observer.observed
    expect(clip.closest('[data-ui="Text"]')).not.toBeNull()
    expect(clip.childElementCount).toBe(0)
    expect(clip.textContent).toBe('A title too long for its tab')

    layout = {scrollWidth: 200, clientWidth: 240}
    act(() => observer.trigger())
    expect(getByTestId('truncated').textContent).toBe('false')
  })

  it('measures again when the title changes without a resize', async () => {
    layout = {scrollWidth: 80, clientWidth: 120}
    const {getByTestId, rerender} = render(<Title title="Short" />)
    expect(getByTestId('truncated').textContent).toBe('false')

    layout = {scrollWidth: 300, clientWidth: 120}
    rerender(<Title title="A renamed title that no longer fits" />)
    await waitFor(() => expect(getByTestId('truncated').textContent).toBe('true'))
  })
})
