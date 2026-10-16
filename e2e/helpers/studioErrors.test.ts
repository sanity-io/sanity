import {describe, expect, test} from 'vitest'

import {frameWentAway} from './studioErrors'

function frame({detached = false, closed = false} = {}) {
  return {isDetached: () => detached, page: () => ({isClosed: () => closed})}
}

describe('frameWentAway', () => {
  test('skips a frame that navigated during its scan', () => {
    const error = new Error(
      'frame.evaluate: Execution context was destroyed, most likely because of a navigation',
    )
    expect(frameWentAway(frame(), error)).toBe(true)
  })

  test('skips a frame that detached or closed with its page during its scan', () => {
    expect(
      frameWentAway(frame({detached: true}), new Error('frame.evaluate: Frame was detached')),
    ).toBe(true)
    expect(
      frameWentAway(
        frame({closed: true}),
        new Error('frame.evaluate: Target page, context or browser has been closed'),
      ),
    ).toBe(true)
    expect(frameWentAway(frame({detached: true}), new Error('timed out after 10000ms'))).toBe(true)
  })

  test('reports a scan that timed out or failed in a frame that is still there', () => {
    expect(frameWentAway(frame(), new Error('timed out after 10000ms'))).toBe(false)
    expect(
      frameWentAway(frame(), new Error('frame.evaluate: TypeError: scan is not a function')),
    ).toBe(false)
  })
})
