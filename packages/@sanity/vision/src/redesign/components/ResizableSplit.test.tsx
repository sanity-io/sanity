import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ResizableSplit, type ResizableSplitProps} from './ResizableSplit'

/** Records every observer the split creates, and lets a test deliver a container size */
class ResizeObserverMock {
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

  resize(width: number, height: number) {
    const entry = {contentRect: {width, height}} as unknown as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

function measure(width: number, height: number) {
  act(() => {
    for (const observer of ResizeObserverMock.instances) observer.resize(width, height)
  })
}

interface HarnessProps extends Partial<Omit<ResizableSplitProps, 'children' | 'onChange'>> {
  defaultSize?: number
  onChange?: (size: number, snapped: boolean) => void
}

function Harness({defaultSize = 300, onChange, ...props}: HarnessProps) {
  const [size, setSize] = useState<number | undefined>(undefined)
  const [snapped, setSnapped] = useState(false)
  return (
    <ResizableSplit
      label="Resize"
      minSecondarySize={100}
      minSize={100}
      onChange={(next, nextSnapped) => {
        setSize(next)
        setSnapped(nextSnapped)
        onChange?.(next, nextSnapped)
      }}
      onReset={() => {
        setSize(undefined)
        setSnapped(false)
      }}
      size={size ?? defaultSize}
      snapped={snapped}
      split="vertical"
      testId="split"
      {...props}
    >
      <div>first</div>
      <div>second</div>
    </ResizableSplit>
  )
}

function primaryPane(primary: 'first' | 'second' = 'first'): HTMLElement {
  const root = screen.getByTestId('split')
  return (primary === 'first' ? root.firstElementChild : root.lastElementChild) as HTMLElement
}

describe('ResizableSplit', () => {
  beforeEach(() => {
    ResizeObserverMock.instances = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('is a separator with the size and bounds of the measured container', () => {
    render(<Harness />)
    const handle = screen.getByTestId('split-handle')
    // Until the container is measured the size is shown as given, without bounds
    expect(primaryPane().style.flex).toBe('0 0 300px')
    expect(handle.getAttribute('aria-valuemax')).toBeNull()

    // A fractional container size gives whole-pixel bounds
    measure(801.6, 400)
    expect(handle.getAttribute('role')).toBe('separator')
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-label')).toBe('Resize')
    expect(handle.getAttribute('tabindex')).toBe('0')
    expect(handle.getAttribute('aria-valuenow')).toBe('300')
    expect(handle.getAttribute('aria-valuemin')).toBe('100')
    // The other pane keeps its 100px and the divider its own pixel
    expect(handle.getAttribute('aria-valuemax')).toBe('700')
  })

  it('moves the divider with the keyboard, and the primary pane follows on either side', () => {
    const onChange = vi.fn()
    const {unmount} = render(<Harness onChange={onChange} />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')

    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    expect(primaryPane().style.flex).toBe('0 0 316px')
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(primaryPane().style.flex).toBe('0 0 236px')
    // Keys along the other axis are left alone
    fireEvent.keyDown(handle, {key: 'ArrowUp'})
    expect(primaryPane().style.flex).toBe('0 0 236px')
    fireEvent.keyDown(handle, {key: 'End'})
    expect(primaryPane().style.flex).toBe('0 0 700px')
    fireEvent.keyDown(handle, {key: 'Home'})
    expect(primaryPane().style.flex).toBe('0 0 100px')
    // At a bound the key changes nothing and reports nothing
    onChange.mockClear()
    fireEvent.keyDown(handle, {key: 'ArrowLeft'})
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(handle, {key: 'Enter'})
    expect(primaryPane().style.flex).toBe('0 0 300px')
    unmount()

    // A bottom panel: the second pane is the primary one, so moving the divider down shrinks it
    ResizeObserverMock.instances = []
    render(<Harness defaultSize={200} primary="second" split="horizontal" />)
    measure(400, 601)
    const bottomHandle = screen.getByTestId('split-handle')
    expect(bottomHandle.getAttribute('aria-orientation')).toBe('horizontal')
    expect(primaryPane('second').style.flex).toBe('0 0 200px')
    expect(primaryPane('first').style.flex).toBe('')
    fireEvent.keyDown(bottomHandle, {key: 'ArrowDown'})
    expect(primaryPane('second').style.flex).toBe('0 0 184px')
    fireEvent.keyDown(bottomHandle, {key: 'ArrowUp', shiftKey: true})
    expect(primaryPane('second').style.flex).toBe('0 0 264px')
    fireEvent.keyDown(bottomHandle, {key: 'End'})
    expect(primaryPane('second').style.flex).toBe('0 0 500px')
  })

  it('follows the pointer while it is down, within the bounds', () => {
    render(<Harness />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')

    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    expect(handle.getAttribute('data-dragging')).toBe('true')
    fireEvent.pointerMove(handle, {clientX: 340})
    expect(primaryPane().style.flex).toBe('0 0 340px')
    // Beyond the far edge the other pane keeps its minimum
    fireEvent.pointerMove(handle, {clientX: 1500})
    expect(primaryPane().style.flex).toBe('0 0 700px')
    fireEvent.pointerUp(handle)
    expect(handle.getAttribute('data-dragging')).toBe('false')
    // After the pointer is up, moves change nothing
    fireEvent.pointerMove(handle, {clientX: 400})
    expect(primaryPane().style.flex).toBe('0 0 700px')
  })

  it('reports where a drag or a key press left the divider, and where it started', () => {
    const onResizeEnd = vi.fn()
    render(<Harness onResizeEnd={onResizeEnd} />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')

    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 340})
    fireEvent.pointerMove(handle, {clientX: 360})
    expect(onResizeEnd).not.toHaveBeenCalled()
    fireEvent.pointerUp(handle)
    expect(onResizeEnd).toHaveBeenCalledExactlyOnceWith(360, 300)

    // A click on the divider without a move is no resize
    fireEvent.pointerDown(handle, {button: 0, clientX: 360, pointerId: 1})
    fireEvent.pointerUp(handle)
    expect(onResizeEnd).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(handle, {key: 'Home'})
    expect(onResizeEnd).toHaveBeenLastCalledWith(100, 360)
    // Already at the bound, so nothing moves
    fireEvent.keyDown(handle, {key: 'Home'})
    expect(onResizeEnd).toHaveBeenCalledTimes(2)
  })

  it('clamps a size the container can no longer hold, and restores it when it can', () => {
    render(<Harness defaultSize={600} />)
    measure(801, 400)
    expect(primaryPane().style.flex).toBe('0 0 600px')
    measure(501, 400)
    expect(primaryPane().style.flex).toBe('0 0 400px')
    expect(screen.getByTestId('split-handle').getAttribute('aria-valuemax')).toBe('400')
    measure(801, 400)
    expect(primaryPane().style.flex).toBe('0 0 600px')
  })

  it('leaves the size alone while the container is not laid out', () => {
    // A pane kept mounted under `display: none` (the phone layout's other column, a tool hidden
    // in an <Activity>) measures 0×0; that is not a container to clamp against
    render(<Harness defaultSize={600} />)
    measure(801, 400)
    expect(primaryPane().style.flex).toBe('0 0 600px')
    measure(0, 0)
    expect(primaryPane().style.flex).toBe('0 0 600px')
    expect(screen.getByTestId('split-handle').getAttribute('aria-valuemax')).toBeNull()
    measure(801, 400)
    expect(primaryPane().style.flex).toBe('0 0 600px')
  })

  it('snaps a drag near equal halves to them, and lets go past the threshold', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} snapToCenter />)
    // 801px: the center is 400, the threshold 12px
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')
    expect(handle.getAttribute('data-snapped')).toBe('false')

    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 391})
    expect(primaryPane().style.flex).toBe('0 0 400px')
    expect(handle.getAttribute('data-snapped')).toBe('true')
    fireEvent.pointerMove(handle, {clientX: 412})
    expect(primaryPane().style.flex).toBe('0 0 400px')
    // Past the threshold the pane catches up with the pointer instead of jumping to it
    fireEvent.pointerMove(handle, {clientX: 418})
    expect(primaryPane().style.flex).toBe('0 0 412px')
    expect(handle.getAttribute('data-snapped')).toBe('false')
    fireEvent.pointerMove(handle, {clientX: 430})
    expect(primaryPane().style.flex).toBe('0 0 430px')
    // Snapping back, then letting go there, reports the center like any other size
    fireEvent.pointerMove(handle, {clientX: 405})
    fireEvent.pointerUp(handle)
    expect(onChange).toHaveBeenLastCalledWith(400, true)
    expect(primaryPane().style.flex).toBe('0 0 400px')
  })

  it('keeps snapped equal halves through container resizes until a drag moves off them', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} snapToCenter />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')
    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 395})
    fireEvent.pointerUp(handle)
    expect(onChange).toHaveBeenLastCalledWith(400, true)

    // Narrower and wider containers (a window resize, the Studio sidebar) keep the halves equal
    measure(601, 400)
    expect(primaryPane().style.flex).toBe('0 0 300px')
    expect(handle.getAttribute('data-snapped')).toBe('true')
    expect(handle.getAttribute('aria-valuenow')).toBe('300')
    measure(1201, 400)
    expect(primaryPane().style.flex).toBe('0 0 600px')
    expect(handle.getAttribute('data-snapped')).toBe('true')

    // A drag off the center drops the snap, and later resizes keep the dragged size
    fireEvent.pointerDown(handle, {button: 0, clientX: 600, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 700})
    fireEvent.pointerUp(handle)
    expect(onChange).toHaveBeenLastCalledWith(700, false)
    measure(1001, 400)
    expect(primaryPane().style.flex).toBe('0 0 700px')
    expect(handle.getAttribute('data-snapped')).toBe('false')

    // Dragging back onto the center snaps again
    fireEvent.pointerDown(handle, {button: 0, clientX: 700, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 505})
    fireEvent.pointerUp(handle)
    expect(onChange).toHaveBeenLastCalledWith(500, true)
    measure(801, 400)
    expect(primaryPane().style.flex).toBe('0 0 400px')
    expect(handle.getAttribute('data-snapped')).toBe('true')
  })

  it('does not jump when a drag starts just outside the snap zone', () => {
    // 801px: the center is 400 and the snap zone 12px, so 418 is in the ramp band but not held
    render(<Harness defaultSize={418} snapToCenter />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')
    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 300})
    expect(primaryPane().style.flex).toBe('0 0 418px')
    fireEvent.pointerMove(handle, {clientX: 305})
    expect(primaryPane().style.flex).toBe('0 0 423px')
    expect(handle.getAttribute('data-snapped')).toBe('false')
  })

  it('stops an arrow key step that would pass over equal halves on them', () => {
    render(<Harness defaultSize={390} snapToCenter />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')

    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    expect(primaryPane().style.flex).toBe('0 0 400px')
    expect(handle.getAttribute('data-snapped')).toBe('true')
    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    expect(primaryPane().style.flex).toBe('0 0 416px')
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(primaryPane().style.flex).toBe('0 0 400px')
    // Home and End still go to the bounds
    fireEvent.keyDown(handle, {key: 'End'})
    expect(primaryPane().style.flex).toBe('0 0 700px')
  })

  it('does not snap when equal halves would break a minimum, or without the option', () => {
    render(<Harness defaultSize={300} minSecondarySize={100} minSize={420} snapToCenter />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')
    fireEvent.pointerDown(handle, {button: 0, clientX: 420, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 400})
    expect(primaryPane().style.flex).toBe('0 0 420px')
    fireEvent.pointerUp(handle)
    cleanup()

    ResizeObserverMock.instances = []
    render(<Harness />)
    measure(801, 400)
    fireEvent.pointerDown(screen.getByTestId('split-handle'), {
      button: 0,
      clientX: 300,
      pointerId: 1,
    })
    fireEvent.pointerMove(screen.getByTestId('split-handle'), {clientX: 395})
    expect(primaryPane().style.flex).toBe('0 0 395px')
  })

  it('takes the divider out of the way while resizing is not allowed', () => {
    const onChange = vi.fn()
    render(<Harness allowResize={false} onChange={onChange} />)
    measure(801, 400)
    const handle = screen.getByTestId('split-handle')
    expect(handle.getAttribute('tabindex')).toBe('-1')
    expect(handle.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    fireEvent.pointerDown(handle, {button: 0, clientX: 300, pointerId: 1})
    fireEvent.pointerMove(handle, {clientX: 340})
    expect(onChange).not.toHaveBeenCalled()
    expect(primaryPane().style.flex).toBe('0 0 300px')
  })
})
