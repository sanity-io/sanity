const TAB_LOCK_PREFIX = 'sanity-studio-tab:'
const TAB_CHANNEL_NAME = 'sanity-studio-tabs'
const TAB_OPENED_MESSAGE = 'opened'

const studioTabs: {peak: number | undefined; isTracking: boolean} = {
  peak: undefined,
  isTracking: false,
}

/**
 * The most Studio tabs this tab has seen open at once on this origin, itself included, or
 * `undefined` where the browser cannot tell (no Web Locks outside a secure context).
 *
 * @internal
 */
export function getPeakStudioTabCount(): number | undefined {
  return studioTabs.peak
}

/**
 * Registers this tab as an open Studio tab for as long as the page lives, and keeps the peak
 * count of open tabs up to date. Safe to call more than once.
 *
 * @internal
 */
export function startTrackingStudioTabs(): void {
  if (studioTabs.isTracking || typeof navigator === 'undefined' || navigator.locks === undefined) {
    return
  }
  studioTabs.isTracking = true

  // The count of open tabs only ever rises when a tab opens, so every tab samples it then.
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  channel.addEventListener('message', (event) => {
    if (event.data === TAB_OPENED_MESSAGE) void sampleOpenTabs()
  })

  // The browser releases the lock when the tab closes or crashes, so a held lock is an open tab.
  void navigator.locks.request(`${TAB_LOCK_PREFIX}${crypto.randomUUID()}`, () => {
    void sampleOpenTabs()
    channel.postMessage(TAB_OPENED_MESSAGE)
    return new Promise<never>(() => undefined)
  })
}

async function sampleOpenTabs(): Promise<void> {
  const {held = []} = await navigator.locks.query()
  const openTabs = held.filter((lock) => lock.name?.startsWith(TAB_LOCK_PREFIX)).length
  studioTabs.peak = Math.max(studioTabs.peak ?? 0, openTabs)
}
