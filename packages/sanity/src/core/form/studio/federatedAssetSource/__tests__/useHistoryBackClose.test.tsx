import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useHistoryBackClose} from '../useHistoryBackClose'

function Dialog(props: {enabled?: boolean; onClose: () => void}) {
  useHistoryBackClose(props.enabled ?? true, props.onClose)
  return null
}

/**
 * jsdom performs history traversal (and its popstate dispatch) as a queued
 * asynchronous task — wait until a traversal settles instead of assuming a
 * single tick is enough.
 */
async function settleHistory(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    // oxlint-disable-next-line no-await-in-loop -- sequential ticks
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

const markerOnTop = () =>
  typeof window.history.state === 'object' &&
  window.history.state !== null &&
  '__sanityFederatedAssetSourceDialog' in window.history.state

describe('useHistoryBackClose', () => {
  afterEach(async () => {
    // Drain any entries a test left behind so suites stay independent.
    while (markerOnTop()) {
      window.history.back()
      // oxlint-disable-next-line no-await-in-loop -- sequential traversal
      await settleHistory()
    }
  })

  it('pushes a same-URL entry on mount and closes the dialog when it is popped', async () => {
    const onClose = vi.fn()
    const before = window.location.href

    render(<Dialog onClose={onClose} />)
    expect(markerOnTop()).toBe(true)
    expect(window.location.href).toBe(before)

    window.history.back()
    await settleHistory()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(markerOnTop()).toBe(false)
  })

  it('removes its entry when the dialog closes by other means', async () => {
    const onClose = vi.fn()
    const {unmount} = render(<Dialog onClose={onClose} />)
    expect(markerOnTop()).toBe(true)

    unmount()
    await settleHistory()

    expect(markerOnTop()).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('survives a StrictMode mount cycle without closing or stacking entries', async () => {
    const onClose = vi.fn()
    render(
      <StrictMode>
        <Dialog onClose={onClose} />
      </StrictMode>,
    )
    await settleHistory()

    expect(onClose).not.toHaveBeenCalled()
    expect(markerOnTop()).toBe(true)

    // One back press closes it — there is exactly one entry to pop.
    window.history.back()
    await settleHistory()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(markerOnTop()).toBe(false)
  })

  it('does nothing when disabled (headless upload mount)', async () => {
    const onClose = vi.fn()
    const {unmount} = render(<Dialog enabled={false} onClose={onClose} />)

    expect(markerOnTop()).toBe(false)
    unmount()
    await settleHistory()
    expect(onClose).not.toHaveBeenCalled()
  })
})
