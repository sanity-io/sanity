import {type Locator, type Page} from 'playwright'

/**
 * The eFPS harness measures render latency by typing a run of characters into a
 * field, bracketed by two marker strings, and matching each character to a
 * render event where it appears *between* the markers.
 *
 * The catch: the Studio document form can briefly flip to read-only mid-typing
 * (e.g. while an async subscription such as `useDocumentVersions` resolves and
 * re-renders the pane). A keystroke dispatched during that window is silently
 * swallowed — and worse, the caret jumps to the end of the field, so naively
 * re-typing lands the character in the wrong place. Left unhandled this
 * surfaced as the flaky "No matching event" failure, and it can also corrupt
 * the markers themselves if the flip lands during marker setup.
 *
 * The helpers here make both the marker setup and the measured typing resilient
 * to that flip: type only while the form is editable, verify each character
 * actually landed where expected, and retry (re-placing the caret) if not.
 */

const ATTEMPT_TIMEOUT = 2_000
const MAX_ATTEMPTS = 10

/**
 * Types the ending and starting markers with the caret positioned between them,
 * retrying until both markers are present in the value. Must be robust to the
 * read-only flip landing during setup (which would otherwise leave the markers
 * mangled and every subsequent match failing).
 */
export async function setUpMarkers({
  page,
  input,
  startingMarker,
  endingMarker,
  getValue,
  timeout,
  clearFirst = false,
}: {
  page: Page
  input: Locator
  startingMarker: string
  endingMarker: string
  getValue: () => Promise<string>
  timeout: number
  /**
   * Clear the field before typing the markers. Safe for single-value inputs
   * (which start empty); must stay off for the Portable Text editor, whose
   * value is pre-existing document prose the markers are typed into.
   */
  clearFirst?: boolean
}): Promise<void> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await waitForEditable(page, timeout)

    if (clearFirst) {
      // Start from a clean field so a partial previous attempt can't corrupt
      // the markers (e.g. `_ENaD__` from a flip mid-setup).
      await input.press('ControlOrMeta+a')
      await input.press('Delete')
    }

    await input.pressSequentially(endingMarker)
    for (let i = 0; i < endingMarker.length; i++) await input.press('ArrowLeft')
    await input.pressSequentially(startingMarker)

    const deadline = Date.now() + ATTEMPT_TIMEOUT
    for (;;) {
      const value = await getValue()
      if (value.includes(startingMarker) && value.includes(endingMarker)) return
      if (Date.now() >= deadline) break
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  throw new Error(
    `Failed to set up markers after ${MAX_ATTEMPTS} attempts ` +
      `(last value: ${JSON.stringify(await getValue())})`,
  )
}

/**
 * Types a single character and confirms it registered by polling the value
 * until the character appears *between* the markers, retrying if it was
 * swallowed by a read-only flip.
 *
 * The between-markers check matters because the value can contain the character
 * elsewhere — the markers themselves include letters (e.g. `S`, `T`, `A`, `R`
 * in `__START__`), and a rich-text field's value includes any pre-existing
 * document prose.
 *
 * Returns the timestamp of the keystroke that actually landed, so a retried
 * character's measured latency isn't inflated by the time spent waiting out the
 * read-only flip.
 */
export async function typeCharacterReliably({
  page,
  input,
  character,
  startingMarker,
  endingMarker,
  getValue,
  timeout,
}: {
  page: Page
  input: Locator
  character: string
  startingMarker: string
  endingMarker: string
  getValue: () => Promise<string>
  timeout: number
}): Promise<number> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Only type while the form is editable — typing during a read-only flip
    // drops the keystroke and moves the caret.
    await waitForEditable(page, timeout)

    // On a retry the caret may have moved (a swallowed keystroke sends it to
    // the end of the field). Re-place it between the markers before typing.
    if (attempt > 0) {
      await input.press('End')
      for (let i = 0; i < endingMarker.length; i++) await input.press('ArrowLeft')
    }

    const timestamp = Date.now()
    await input.pressSequentially(character)

    const deadline = Date.now() + ATTEMPT_TIMEOUT
    for (;;) {
      if (containsBetweenMarkers(await getValue(), character, startingMarker, endingMarker)) {
        return timestamp
      }
      if (Date.now() >= deadline) break
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  throw new Error(
    `Failed to type ${JSON.stringify(character)} after ${MAX_ATTEMPTS} attempts ` +
      `(last value: ${JSON.stringify(await getValue())})`,
  )
}

function waitForEditable(page: Page, timeout: number): Promise<void> {
  return page
    .locator('[data-testid="form-view"]:not([data-read-only="true"])')
    .waitFor({state: 'visible', timeout})
}

function containsBetweenMarkers(
  value: string,
  character: string,
  startingMarker: string,
  endingMarker: string,
): boolean {
  if (!value.includes(startingMarker) || !value.includes(endingMarker)) return false
  const [, afterStartingMarker] = value.split(startingMarker)
  const [beforeEndingMarker] = afterStartingMarker.split(endingMarker)
  return beforeEndingMarker.includes(character)
}
