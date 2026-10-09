import {configure} from '@chromatic-com/vitest'
import {Box, Text} from '@sanity/ui'
import {useState} from 'react'
import {afterEach, describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {cdp, page, server} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {Popover} from '../Popover'

// Timing test: the end state is a closed popover, which is nothing to archive.
configure({disableAutoSnapshot: true})

/**
 * What the Chrome DevTools Animations panel applies when its playback speed is
 * set to 25%: `document.timeline` then advances at a quarter of the speed of
 * `performance.now()`.
 */
const DEVTOOLS_PLAYBACK_RATE = 0.25

/**
 * Real time to let the two clocks drift apart before the popover closes. The
 * unpatched `motion-dom` schedules the WAAPI exit animation
 * `(1 - rate) * drift` timeline-milliseconds into the future, so this is what
 * turns "starts a little late" into "never starts".
 */
const CLOCK_DRIFT_MS = 1_000

const POPOVER_CARD = '[data-ui="Popover"][data-placement]'

function PopoverHarness() {
  const [open, setOpen] = useState(true)
  return (
    <TestWrapper schemaTypes={[]}>
      <Box padding={5}>
        <Popover
          content={
            <Box padding={3}>
              <Text size={1}>Popover content</Text>
            </Box>
          }
          open={open}
          placement="bottom"
          portal
        >
          <Button
            data-testid="toggle-popover"
            mode="ghost"
            text={open ? 'Close' : 'Open'}
            onClick={() => setOpen((current) => !current)}
          />
        </Popover>
      </Box>
    </TestWrapper>
  )
}

function popoverCard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(POPOVER_CARD)
}

function isDisplayed(element: HTMLElement | null): boolean {
  return element !== null && element.checkVisibility()
}

function runningAnimation(element: HTMLElement | null): Animation | undefined {
  return element?.getAnimations().find((animation) => animation.playState === 'running')
}

// The Animation domain is Chrome DevTools Protocol only.
describe.skipIf(server.browser !== 'chromium')('Popover under a slowed animation timeline', () => {
  afterEach(async () => {
    // The playback rate is page-wide. Files running in parallel each have their
    // own tab, but this tab is reused for the files scheduled after this one.
    await cdp().send('Animation.setPlaybackRate', {playbackRate: 1})
  })

  test('the exit animation starts right away and the popover hides once it finishes', async () => {
    void render(<PopoverHarness />)

    await expect.poll(() => isDisplayed(popoverCard())).toBe(true)
    await expect.poll(() => getComputedStyle(popoverCard()!).opacity).toBe('1')

    await cdp().send('Animation.enable')
    await cdp().send('Animation.setPlaybackRate', {playbackRate: DEVTOOLS_PLAYBACK_RATE})
    await new Promise((resolve) => setTimeout(resolve, CLOCK_DRIFT_MS))

    await page.getByTestId('toggle-popover').click()

    // motion runs the opacity part of the exit through WAAPI; that animation is
    // resolved against `document.timeline`, so a start time taken from
    // `performance.now()` lands in the timeline's future (negative currentTime).
    await expect.poll(() => runningAnimation(popoverCard()) !== undefined).toBe(true)
    expect(runningAnimation(popoverCard())!.currentTime as number).toBeGreaterThanOrEqual(0)

    // 350ms of spring at 25% is 1.4s of real time; well within the poll timeout.
    await expect.poll(() => isDisplayed(popoverCard())).toBe(false)
  })
})
