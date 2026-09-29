import {configure} from '@chromatic-com/vitest'
import {Box} from '@sanity/ui'
import {afterEach, describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {cdp, page, server, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {Tooltip} from '../Tooltip'

// Timing test: the end state is a closed tooltip, which is nothing to archive.
configure({disableAutoSnapshot: true})

/**
 * What the Chrome DevTools Animations panel applies when its playback speed is
 * set to 25%: `document.timeline` then advances at a quarter of the speed of
 * `performance.now()`.
 */
const DEVTOOLS_PLAYBACK_RATE = 0.25

/**
 * Real time to let the two clocks drift apart before the tooltip closes. The
 * unpatched `motion-dom` schedules the WAAPI exit animation
 * `(1 - rate) * drift` timeline-milliseconds into the future, so this is what
 * turns "starts a little late" into "never starts".
 */
const CLOCK_DRIFT_MS = 1_000

const TOOLTIP_CARD = '[data-ui="Tooltip__card"]'

function TooltipHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Box padding={5}>
        <Tooltip content="Tooltip content">
          <Button data-testid="tooltip-trigger" mode="ghost" text="Hover me" />
        </Tooltip>
      </Box>
    </TestWrapper>
  )
}

function tooltipCard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(TOOLTIP_CARD)
}

function isDisplayed(element: HTMLElement | null): boolean {
  return element !== null && element.checkVisibility()
}

function runningAnimation(element: HTMLElement | null): Animation | undefined {
  return element?.getAnimations().find((animation) => animation.playState === 'running')
}

// The Animation domain is Chrome DevTools Protocol only.
describe.skipIf(server.browser !== 'chromium')('Tooltip under a slowed animation timeline', () => {
  afterEach(async () => {
    // The playback rate is page-wide, so it must not leak into other tests.
    await cdp().send('Animation.setPlaybackRate', {playbackRate: 1})
  })

  test('the exit animation starts right away and the tooltip hides once it finishes', async () => {
    void render(<TooltipHarness />)

    await userEvent.hover(page.getByTestId('tooltip-trigger'))
    await expect.poll(() => isDisplayed(tooltipCard())).toBe(true)
    await expect.poll(() => getComputedStyle(tooltipCard()!).opacity).toBe('1')

    await cdp().send('Animation.enable')
    await cdp().send('Animation.setPlaybackRate', {playbackRate: DEVTOOLS_PLAYBACK_RATE})
    await new Promise((resolve) => setTimeout(resolve, CLOCK_DRIFT_MS))

    await userEvent.unhover(page.getByTestId('tooltip-trigger'))

    // motion runs the opacity part of the exit through WAAPI; that animation is
    // resolved against `document.timeline`, so a start time taken from
    // `performance.now()` lands in the timeline's future (negative currentTime).
    await expect.poll(() => runningAnimation(tooltipCard()) !== undefined).toBe(true)
    expect(runningAnimation(tooltipCard())!.currentTime as number).toBeGreaterThanOrEqual(0)

    // 350ms of spring at 25% is 1.4s of real time; well within the poll timeout.
    await expect.poll(() => isDisplayed(tooltipCard())).toBe(false)
  })
})
