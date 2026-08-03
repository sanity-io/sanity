import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {StrictMode} from 'react'
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {ChangeFieldWrapper} from '../ChangeFieldWrapper'
import {ChangeIndicator} from '../ChangeIndicator'
import {scrollIntoView} from '../helpers/scrollIntoView'
import {ChangeConnectorRoot} from './ChangeConnectorRoot'

vi.mock('../helpers/scrollIntoView', () => ({scrollIntoView: vi.fn()}))

const sleep = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)))

// Waits for the overlay to settle on its final state. The tracker's debounced publish
// (10ms), the re-render it causes, and the overlay's measuring animation frame each need
// their own flush of React's update queue, hence the successive `act()` passes.
async function waitForOverlayToSettle() {
  await sleep()
  await sleep()
  await sleep()
}

const originalDescriptors = {
  offsetTop: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop'),
  offsetLeft: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft'),
  offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth'),
  offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
}

// The tracked elements' vertical offset, made mutable so a test can shift the layout and assert
// the connector re-measures on scroll.
const DEFAULT_TRACKED_OFFSET_TOP = 100
let trackedOffsetTop = DEFAULT_TRACKED_OFFSET_TOP

beforeAll(() => {
  // jsdom does not do layout, so give the tracked elements just enough geometry for a
  // connector to be considered in bounds and drawn.
  const isRoot = (element: HTMLElement) => element.dataset.testid === 'scroll-container'

  Object.defineProperties(HTMLElement.prototype, {
    offsetTop: {
      configurable: true,
      get(this: HTMLElement) {
        return isRoot(this) ? 0 : trackedOffsetTop
      },
    },
    offsetLeft: {
      configurable: true,
      get(this: HTMLElement) {
        return isRoot(this) ? 0 : 50
      },
    },
    offsetWidth: {
      configurable: true,
      get(this: HTMLElement) {
        return isRoot(this) ? 800 : 100
      },
    },
    offsetHeight: {
      configurable: true,
      get(this: HTMLElement) {
        return isRoot(this) ? 600 : 20
      },
    },
  })
})

afterAll(() => {
  Object.defineProperties(HTMLElement.prototype, originalDescriptors as PropertyDescriptorMap)
})

afterEach(() => {
  trackedOffsetTop = DEFAULT_TRACKED_OFFSET_TOP
  vi.mocked(scrollIntoView).mockClear()
})

function Harness(props: {isReviewChangesOpen: boolean; trackedElementsKey?: string}) {
  const {isReviewChangesOpen, trackedElementsKey = 'default'} = props

  return (
    <ChangeConnectorRoot
      isReviewChangesOpen={isReviewChangesOpen}
      onOpenReviewChanges={() => {}}
      onSetFocus={() => {}}
    >
      {/* The form side of the connector */}
      <ChangeIndicator
        key={`field-${trackedElementsKey}`}
        data-testid="tracked-field"
        hasFocus
        isChanged
        path={['title']}
      >
        <div>field</div>
      </ChangeIndicator>
      {/* The review changes panel side of the connector */}
      <ChangeFieldWrapper
        key={`change-${trackedElementsKey}`}
        hasRevertHover={false}
        path={['title']}
      >
        <div data-testid="tracked-change-content">change</div>
      </ChangeFieldWrapper>
    </ChangeConnectorRoot>
  )
}

describe('ConnectorsOverlay', () => {
  it('draws a connector for a focused changed field while review changes is open, and removes it when review changes closes', async () => {
    const TestProvider = await createTestProvider()

    const {rerender} = render(<Harness isReviewChangesOpen />, {wrapper: TestProvider})

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).not.toBeNull()

    // Close the review changes panel and expect the connector to be removed.
    rerender(<Harness isReviewChangesOpen={false} />)

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).toBeNull()

    // Reopening it should draw the connector again.
    rerender(<Harness isReviewChangesOpen />)

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).not.toBeNull()
  })

  it('does not draw connectors while review changes is closed', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isReviewChangesOpen={false} />, {wrapper: TestProvider})

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).toBeNull()
  })

  it('draws a connector when hovering a diff whose form field is registered at a deeper path', async () => {
    // Image and file inputs register their change indicator at `<field>.asset` while the
    // changes panel registers the diff at `<field>`.
    const TestProvider = await createTestProvider()

    render(
      <ChangeConnectorRoot isReviewChangesOpen onOpenReviewChanges={() => {}} onSetFocus={() => {}}>
        <ChangeIndicator hasFocus={false} isChanged path={['image', 'asset']}>
          <div>field</div>
        </ChangeIndicator>
        <ChangeFieldWrapper hasRevertHover={false} path={['image']}>
          <div>change</div>
        </ChangeFieldWrapper>
      </ChangeConnectorRoot>,
      {wrapper: TestProvider},
    )

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).toBeNull()

    await userEvent.hover(screen.getByText('change'))

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).not.toBeNull()

    await userEvent.unhover(screen.getByText('change'))

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).toBeNull()
  })

  it('re-measures the connector when the scroll container scrolls', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isReviewChangesOpen />, {wrapper: TestProvider})

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    const initialPath = overlay.querySelector('path')?.getAttribute('d')
    expect(initialPath).toBeTruthy()

    // Shift the tracked layout and scroll. The overlay subscribes to the scroll container, so it
    // should re-measure on the next frame and draw the connector at its new position.
    trackedOffsetTop = 300
    act(() => {
      screen.getByTestId('scroll-container').dispatchEvent(new Event('scroll'))
    })

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')?.getAttribute('d')).not.toBe(initialPath)
  })

  it('does not redraw the connector when a scroll leaves the layout unchanged', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isReviewChangesOpen />, {wrapper: TestProvider})

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    const initialPath = overlay.querySelector('path')?.getAttribute('d')
    expect(initialPath).toBeTruthy()

    // Scroll without shifting the tracked layout. The measured geometry is identical, so the
    // equality bail-out should keep the existing connector rather than redraw it.
    act(() => {
      screen.getByTestId('scroll-container').dispatchEvent(new Event('scroll'))
    })

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')?.getAttribute('d')).toBe(initialPath)
  })

  it('uses remounted tracked elements when the connector geometry is unchanged', async () => {
    const TestProvider = await createTestProvider()

    const {rerender} = render(<Harness isReviewChangesOpen trackedElementsKey="initial" />, {
      wrapper: TestProvider,
    })

    const overlay = screen.getByTestId('change-connectors-overlay')
    await waitForOverlayToSettle()

    const initialField = screen.getByTestId('tracked-field')
    const initialChange = screen.getByTestId('tracked-change-content').parentElement
    if (!initialChange) throw new Error('Expected a tracked change element')

    rerender(<Harness isReviewChangesOpen trackedElementsKey="remounted" />)
    await waitForOverlayToSettle()

    const remountedField = screen.getByTestId('tracked-field')
    const remountedChange = screen.getByTestId('tracked-change-content').parentElement
    if (!remountedChange) throw new Error('Expected a remounted tracked change element')
    expect(remountedField).not.toBe(initialField)
    expect(remountedChange).not.toBe(initialChange)
    expect(remountedField.offsetTop).toBe(initialField.offsetTop)
    expect(remountedChange.offsetTop).toBe(initialChange.offsetTop)

    const connectorGroup = overlay.querySelector('g')
    if (!connectorGroup) throw new Error('Expected a connector group')
    await userEvent.click(connectorGroup)

    expect(scrollIntoView).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({element: remountedField}),
    )
    expect(scrollIntoView).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({element: remountedChange}),
    )
  })

  it('still draws the connector after a StrictMode mount/unmount/mount', async () => {
    const TestProvider = await createTestProvider()

    // StrictMode double-invokes effects (mount/unmount/mount). The scheduler must re-arm after
    // the cleanup cancels its pending frame, otherwise the connector never draws on a dev load.
    render(
      <StrictMode>
        <Harness isReviewChangesOpen />
      </StrictMode>,
      {wrapper: TestProvider},
    )

    const overlay = screen.getByTestId('change-connectors-overlay')

    await waitForOverlayToSettle()
    expect(overlay.querySelector('path')).not.toBeNull()
  })
})
