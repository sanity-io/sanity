import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {ChangeFieldWrapper} from '../ChangeFieldWrapper'
import {ChangeIndicator} from '../ChangeIndicator'
import {ChangeConnectorRoot} from './ChangeConnectorRoot'

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

beforeAll(() => {
  // jsdom does not do layout, so give the tracked elements just enough geometry for a
  // connector to be considered in bounds and drawn.
  const isRoot = (element: HTMLElement) => element.dataset.testid === 'scroll-container'

  Object.defineProperties(HTMLElement.prototype, {
    offsetTop: {
      configurable: true,
      get(this: HTMLElement) {
        return isRoot(this) ? 0 : 100
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

function Harness(props: {isReviewChangesOpen: boolean}) {
  const {isReviewChangesOpen} = props

  return (
    <ChangeConnectorRoot
      isReviewChangesOpen={isReviewChangesOpen}
      onOpenReviewChanges={() => {}}
      onSetFocus={() => {}}
    >
      {/* The form side of the connector */}
      <ChangeIndicator hasFocus isChanged path={['title']}>
        <div>field</div>
      </ChangeIndicator>
      {/* The review changes panel side of the connector */}
      <ChangeFieldWrapper hasRevertHover={false} path={['title']}>
        <div>change</div>
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
})
