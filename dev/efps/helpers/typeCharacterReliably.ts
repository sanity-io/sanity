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
 *
 * The markers are anchored at the very end of the field's value so their
 * placement is deterministic (a click into a large Portable Text field can land
 * the caret anywhere in the prose). Caret recovery, however, positions the
 * caret directly before the live ending marker via the DOM selection APIs — a
 * stray character from a failed attempt can land *after* the ending marker (a
 * caret jump goes to the very end of the field), so any fixed-distance stepping
 * from the end would be off by the length of the debris.
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

    // Anchor the markers at the very end of the value — both so their position
    // is deterministic (a click into a large Portable Text field can land the
    // caret anywhere in the prose) and so caret recovery can reliably find them
    // again (see `moveCaretToEnd`).
    await moveCaretToEnd(input)

    await input.pressSequentially(endingMarker)
    for (let i = 0; i < endingMarker.length; i++) await input.press('ArrowLeft')
    await input.pressSequentially(startingMarker)

    const deadline = Date.now() + ATTEMPT_TIMEOUT
    for (;;) {
      const value = await getValue()
      // Require the pair to be adjacent: nothing has been typed between the
      // markers yet, so `___START______END___` must appear as one unit. A flip
      // mid-setup can leave both markers present but separated (the caret
      // jumped between typing one and the other), which would poison every
      // subsequent between-markers match.
      if (value.includes(startingMarker + endingMarker)) return
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

    // On a retry the caret may have moved (a caret jump sends it to the end of
    // the field, where a stray copy of the character may also have landed —
    // possibly *after* the ending marker). Re-place it directly before the
    // ending marker; positioning relative to the end of the value would be
    // thrown off by such debris.
    if (attempt > 0) {
      await placeCaretBeforeEndingMarker(input, {startingMarker, endingMarker})
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

/**
 * Moves the caret to the very end of the input's value.
 *
 * Uses the DOM selection APIs rather than keyboard navigation: `End` only
 * reaches the end of the current line/block in a multi-block contenteditable
 * (like the Portable Text editor), and the document-end shortcut differs per
 * platform (`Control+End` vs `Meta+ArrowDown`).
 */
async function moveCaretToEnd(input: Locator): Promise<void> {
  await input.evaluate((el) => {
    // Focus before positioning the caret — focusing afterwards (which the next
    // key press would do implicitly) can reset the selection.
    if (el instanceof HTMLElement) el.focus()

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const length = el.value.length
      el.setSelectionRange(length, length)
      return
    }

    const document = el.ownerDocument
    const selection = document.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  })
}

/**
 * Places the caret directly before the live ending marker — the first
 * occurrence of `endingMarker` after the *last* occurrence of `startingMarker`,
 * mirroring `containsBetweenMarkers`. Falls back to the end of the value if the
 * markers can't be found.
 *
 * NOTE: the evaluate callback must not define any *named* inner functions
 * (including arrow functions assigned to variables). The harness runs through
 * `tsx`, and esbuild's `keepNames` transform wraps such definitions in a
 * `__name(...)` helper call — Playwright serializes the callback with
 * `toString()` and runs it in the page, where that helper doesn't exist
 * (`ReferenceError: __name is not defined`).
 */
async function placeCaretBeforeEndingMarker(
  input: Locator,
  markers: {startingMarker: string; endingMarker: string},
): Promise<void> {
  await input.evaluate((el, {startingMarker, endingMarker}) => {
    // Focus before positioning the caret — focusing afterwards (which the next
    // key press would do implicitly) can reset the selection.
    if (el instanceof HTMLElement) el.focus()

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const value = el.value
      const valueStartIndex = value.lastIndexOf(startingMarker)
      const index = value.indexOf(
        endingMarker,
        valueStartIndex === -1 ? 0 : valueStartIndex + startingMarker.length,
      )
      const caret = index === -1 ? value.length : index
      el.setSelectionRange(caret, caret)
      return
    }

    const document = el.ownerDocument
    const selection = document.getSelection()
    if (!selection) return

    // Concatenate the text nodes (mirroring `textContent`) while tracking each
    // node's global offset, so the marker's global index can be mapped back to
    // a (node, offset) selection position.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes: {node: Node; start: number}[] = []
    let text = ''
    while (walker.nextNode()) {
      nodes.push({node: walker.currentNode, start: text.length})
      text += walker.currentNode.nodeValue ?? ''
    }

    const textStartIndex = text.lastIndexOf(startingMarker)
    const index =
      nodes.length === 0
        ? -1
        : text.indexOf(
            endingMarker,
            textStartIndex === -1 ? 0 : textStartIndex + startingMarker.length,
          )

    const range = document.createRange()
    if (index === -1) {
      range.selectNodeContents(el)
      range.collapse(false)
    } else {
      let target = nodes[0]
      for (const entry of nodes) {
        if (entry.start > index) break
        target = entry
      }
      range.setStart(target.node, index - target.start)
      range.collapse(true)
    }
    selection.removeAllRanges()
    selection.addRange(range)
  }, markers)
}

/**
 * Whether `character` appears between the markers. Uses the *last* occurrence
 * of the starting marker: the live marker pair is anchored at the end of the
 * value, and an aborted earlier `setUpMarkers` attempt can leave a stray
 * (partial or complete) marker earlier in the prose.
 */
export function containsBetweenMarkers(
  value: string,
  character: string,
  startingMarker: string,
  endingMarker: string,
): boolean {
  const startIndex = value.lastIndexOf(startingMarker)
  if (startIndex === -1) return false
  const afterStartingMarker = value.slice(startIndex + startingMarker.length)
  const endIndex = afterStartingMarker.indexOf(endingMarker)
  if (endIndex === -1) return false
  return afterStartingMarker.slice(0, endIndex).includes(character)
}
