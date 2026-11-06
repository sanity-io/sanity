import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useHistoryBackClose} from '../useHistoryBackClose'

function Dialog(props: {enabled?: boolean; onClose: () => void; onBackRequest?: () => boolean}) {
  useHistoryBackClose(props.enabled ?? true, props.onClose, props.onBackRequest)
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

  it('does not close a new dialog mounted before the previous unmount pop settles', async () => {
    // Close-then-reopen (or switching asset sources) in the same turn: the
    // old instance's cleanup `history.back()` settles only after the new
    // instance has mounted. The leftover pop must not read as a user back.
    const onCloseA = vi.fn()
    const {unmount: unmountFirst} = render(<Dialog onClose={onCloseA} />)
    expect(markerOnTop()).toBe(true)

    unmountFirst()
    // No settling in between — mount the next dialog while the pop is pending.
    const onCloseB = vi.fn()
    render(<Dialog onClose={onCloseB} />)
    await settleHistory()

    expect(onCloseB).not.toHaveBeenCalled()
    expect(markerOnTop()).toBe(true)

    // The entry still works: one back press closes the new dialog.
    window.history.back()
    await settleHistory()
    expect(onCloseB).toHaveBeenCalledTimes(1)
    expect(markerOnTop()).toBe(false)
  })

  it("does not let a settled unmount pop swallow a later dialog's first back press", async () => {
    const onCloseA = vi.fn()
    const {unmount: unmountFirst} = render(<Dialog onClose={onCloseA} />)
    unmountFirst()
    // The pop settles with no dialog mounted.
    await settleHistory()
    expect(markerOnTop()).toBe(false)

    const onCloseB = vi.fn()
    render(<Dialog onClose={onCloseB} />)
    expect(markerOnTop()).toBe(true)

    window.history.back()
    await settleHistory()
    expect(onCloseB).toHaveBeenCalledTimes(1)
    expect(markerOnTop()).toBe(false)
  })

  it('keeps the dialog open while the view handles back internally', async () => {
    const onClose = vi.fn()
    // The view has two internal steps to unwind before the dialog may close.
    let internalSteps = 2
    const onBackRequest = vi.fn(() => {
      if (internalSteps === 0) return false
      internalSteps -= 1
      return true
    })
    render(<Dialog onClose={onClose} onBackRequest={onBackRequest} />)
    expect(markerOnTop()).toBe(true)

    // First two presses step back inside the view and restore the entry.
    window.history.back()
    await settleHistory()
    expect(onBackRequest).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(markerOnTop()).toBe(true)

    window.history.back()
    await settleHistory()
    expect(onBackRequest).toHaveBeenCalledTimes(2)
    expect(onClose).not.toHaveBeenCalled()
    expect(markerOnTop()).toBe(true)

    // Nothing left to unwind: the third press closes the dialog.
    window.history.back()
    await settleHistory()
    expect(onBackRequest).toHaveBeenCalledTimes(3)
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
