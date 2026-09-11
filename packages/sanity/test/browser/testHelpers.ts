import {expect, vi} from 'vitest'
import {page, server, userEvent} from 'vitest/browser'

import {TOOLTIP_DELAY_PROPS} from '../../src/ui-components/tooltip/constants'

const DEFAULT_TYPE_DELAY = 20

/**
 * How long `settleChromaticEndState` must observe no visible tooltip before
 * it trusts that none is about to open: the ui-components tooltip open delay
 * plus a margin for the timer and render.
 */
const TOOLTIP_FREE_WINDOW_MS = TOOLTIP_DELAY_PROPS.open + 100

/**
 * `@portabletext/editor` picks the DOM selection up through a leading+trailing
 * throttle of this many milliseconds (`onDOMSelectionChange`), so its internal
 * selection can trail the caret by one keystroke for up to this long.
 */
const PTE_SELECTION_THROTTLE_MS = 100

/** Timer and render slack on top of the throttle before trusting the sync. */
const PTE_SELECTION_SYNC_MARGIN_MS = 50

/** Visible with `visibility` taken into account (`checkVisibility()` alone ignores it). */
const isShown = (el: Element): el is HTMLElement =>
  el instanceof HTMLElement && el.checkVisibility({visibilityProperty: true})

const visibleTooltips = (): HTMLElement[] =>
  Array.from(window.document.querySelectorAll<HTMLElement>('[data-ui="Tooltip"]')).filter((el) =>
    el.checkVisibility(),
  )

/** React hover state of field headers: `data-actions-visible` flips after the pointer leaves. */
const fieldActionsSig = (): string =>
  Array.from(window.document.querySelectorAll('[data-actions-visible]'))
    .map((el) => el.getAttribute('data-actions-visible'))
    .join(',')

/**
 * Geometry signature of every visible match: `x,y,w,h` per element, `''` when
 * none is visible. A match that is mounted but has no size yet (a portal whose
 * lazy content has not laid out) reads as a fresh symbol: it counts as open for
 * the callers that record which overlays must stay open, but `expectStable`
 * can never accept that mid-layout state.
 */
const boxSig = (selector: string) => (): string | symbol => {
  const rects = Array.from(window.document.querySelectorAll<HTMLElement>(selector))
    .filter((el) => el.checkVisibility())
    .map((el) => el.getBoundingClientRect())
  if (rects.some((r) => r.width === 0 || r.height === 0)) return Symbol('zero-size overlay')
  return rects
    .map(
      (r) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)}`,
    )
    .join('|')
}

/**
 * Wrap a signature so an empty value (hidden or unmounted) reads as a fresh
 * symbol: `expectStable` then never accepts a closed overlay as stable.
 */
const present = (sig: () => string | symbol) => (): string | symbol => sig() || Symbol('absent')

/**
 * Round Floating UI / Popper inline `transform` / `top` / `left` to whole CSS
 * pixels. Subpixel placement (e.g. 120.5 vs 121) is stable within a single run
 * but drifts across Chromatic captures of identical code, shifting whole
 * dialogs by 1px and producing large false visual diffs.
 */
const FLOATING_UI_SNAP_SELECTOR = [
  '[data-testid="popover-edit-dialog"]',
  '[data-testid="annotation-toolbar-popover"]',
  '[data-testid="inline-object-toolbar-popover"]',
  '[data-testid="comments-mentions-menu"]',
  '[data-ui="Popover"]',
  '[data-ui="Tooltip"]',
  '[role="menu"]',
  '[role="listbox"]',
].join(', ')

function roundPx(value: string): string {
  return value.replace(/(-?\d+\.?\d*)px/g, (token) => `${Math.round(Number.parseFloat(token))}px`)
}

function snapFloatingUiNode(node: HTMLElement): void {
  const {transform, top, left, translate} = node.style
  if (transform && transform !== 'none') {
    const rounded = roundPx(transform)
    if (rounded !== transform) node.style.transform = rounded
  }
  if (translate) {
    const rounded = roundPx(translate)
    if (rounded !== translate) node.style.translate = rounded
  }
  if (top) {
    const rounded = `${Math.round(Number.parseFloat(top))}px`
    if (rounded !== top) node.style.top = rounded
  }
  if (left) {
    const rounded = `${Math.round(Number.parseFloat(left))}px`
    if (rounded !== left) node.style.left = rounded
  }
}

function snapVisibleFloatingUi(): void {
  const anchors = window.document.querySelectorAll<HTMLElement>(FLOATING_UI_SNAP_SELECTOR)
  const snapped = new Set<HTMLElement>()
  for (const anchor of anchors) {
    if (!anchor.checkVisibility()) continue
    let node: HTMLElement | null = anchor
    for (let depth = 0; depth < 12 && node; depth++, node = node.parentElement) {
      if (snapped.has(node)) break
      const {transform, top, left, translate} = node.style
      const hasTransform = Boolean(transform) && transform !== 'none'
      const hasOffset = Boolean(top) || Boolean(left) || Boolean(translate)
      if (!hasTransform && !hasOffset) continue
      snapped.add(node)
      snapFloatingUiNode(node)
      break
    }
  }
}

const FLOATING_UI_SNAP_OBSERVER_OPTIONS: MutationObserverInit = {
  subtree: true,
  attributes: true,
  attributeFilter: ['style'],
}

/**
 * The observer that keeps re-rounding Floating UI offsets after
 * `snapFloatingUiToIntegerPixels`. One per test: the setup file's `afterEach`
 * releases it so a lock left by one test never keeps rewriting styles in the
 * next one.
 */
let floatingUiSnapObserver: MutationObserver | null = null

export function snapFloatingUiToIntegerPixels(): void {
  snapVisibleFloatingUi()
  // Floating UI can rewrite a half-pixel translate between this call and the
  // archive. Re-round on style mutations until `releaseFloatingUiSnapLock`.
  if (floatingUiSnapObserver) return
  const observer = new MutationObserver(() => {
    if (floatingUiSnapObserver !== observer) return
    // Pause while re-rounding so our own style writes do not re-trigger it.
    observer.disconnect()
    snapVisibleFloatingUi()
    observer.observe(window.document.body, FLOATING_UI_SNAP_OBSERVER_OPTIONS)
  })
  observer.observe(window.document.body, FLOATING_UI_SNAP_OBSERVER_OPTIONS)
  floatingUiSnapObserver = observer
}

/** Stop re-rounding Floating UI offsets. Called from the setup file's `afterEach`. */
export function releaseFloatingUiSnapLock(): void {
  floatingUiSnapObserver?.disconnect()
  floatingUiSnapObserver = null
}

/**
 * Poll `sample` until it returns the same value on `repeats` consecutive
 * re-reads, then return that value. A single matching re-read is not enough
 * for layout driven by ResizeObserver / Floating UI: it can agree once and
 * move again on the next frame, which is exactly what produced pairwise
 * Chromatic diffs of identical code.
 */
export async function expectStable<T>(sample: () => T, repeats = 3): Promise<T> {
  let previous!: T
  let hasPrevious = false
  let stable = 0
  await expect
    .poll(() => {
      const next = sample()
      if (hasPrevious && Object.is(next, previous)) stable += 1
      else {
        previous = next
        hasPrevious = true
        stable = 0
      }
      return stable >= repeats
    })
    .toBe(true)
  return previous
}

const POINTER_PARK_TESTID = 'chromatic-pointer-park'

/**
 * Transparent, fixed 4×4 element in the bottom-right corner of the viewport
 * that `settleChromaticEndState` moves the real pointer onto. It stays in the
 * DOM until the setup file's `afterEach` so the pointer keeps hovering it
 * (and nothing else) while Chromatic archives the end state.
 */
function getPointerPark(): HTMLElement {
  const existing = window.document.querySelector<HTMLElement>(
    `[data-testid="${POINTER_PARK_TESTID}"]`,
  )
  if (existing) return existing
  const park = window.document.createElement('div')
  park.setAttribute('data-testid', POINTER_PARK_TESTID)
  park.setAttribute('aria-hidden', 'true')
  park.style.cssText = 'position:fixed;right:8px;bottom:8px;width:4px;height:4px;z-index:2147483647'
  window.document.body.appendChild(park)
  return park
}

/**
 * Move the real pointer onto the park element and return it. Used at the end
 * of a test by `settleChromaticEndState`, and by the setup file's `beforeEach`
 * so every test starts with the pointer in the bottom-right corner of the
 * default viewport rather than at a fresh page's top-left corner or wherever
 * the previous test's last click (or its park at a reduced viewport) left it.
 */
export async function parkPointer(): Promise<HTMLElement> {
  const park = getPointerPark()
  await userEvent.hover(park)
  return park
}

export function removePointerPark(): void {
  window.document.querySelector(`[data-testid="${POINTER_PARK_TESTID}"]`)?.remove()
}

/** Elements matching `:hover` other than the root, body and the pointer park. */
function hoveredOutside(park: HTMLElement): Element[] {
  return Array.from(window.document.querySelectorAll(':hover')).filter(
    (el) => el !== window.document.documentElement && el !== window.document.body && el !== park,
  )
}

function describeElement(el: Element): string {
  const name = el.getAttribute('data-testid') ?? el.getAttribute('data-ui')
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${name ? `[${name}]` : ''}`
}

const isRendered = (el: Element): el is HTMLElement => {
  if (!isShown(el)) return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/** `root` itself if it is shown with a box, else its first such descendant. */
function firstRendered(root: Element): HTMLElement | undefined {
  if (isRendered(root)) return root
  return Array.from(root.querySelectorAll('*')).find(isRendered)
}

/**
 * WebKit does not re-diff its `:hover` chain when the element under the
 * pointer leaves the DOM (a popover unmounting under the button that was just
 * clicked, a block moved by a drop), so `:hover` stays set on what that chain
 * left behind — the `@sanity/ui` portal container above an unmounted popover,
 * the moved block itself after a drop — wherever the pointer goes next, and
 * parking alone cannot clear it. Entering such an element (or a rendered
 * descendant) for real puts it back into the tracked chain, and the next move
 * away clears it; parking after that leaves the tree hover-free.
 */
async function reenterStaleWebkitHover(park: HTMLElement): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const stale = hoveredOutside(park)
    if (stale.length === 0) return
    const target = stale.map(firstRendered).find((el) => el !== undefined)
    if (!target) return
    // `force` skips actionability waits: only the pointer position matters.
    await userEvent.hover(target, {force: true})
    await userEvent.hover(park)
  }
}

/**
 * `TestForm` marks its form container while a document validation run is in
 * flight; the run ends in a form re-render with the resulting markers.
 */
const validationPending = (): boolean =>
  window.document.querySelector('[data-validation-pending]') !== null

/**
 * Wait until the Portable Text Editor has taken over the current DOM
 * selection, which must read as `text` (`''` for a collapsed caret).
 *
 * The editor syncs `selectionchange` into its own state through a
 * leading+trailing throttle (`PTE_SELECTION_THROTTLE_MS`), so a toolbar
 * action fired straight after Shift+Arrow ×4 or a double-click can run
 * against the selection *before* the last keystroke: the link then covers
 * "ink" instead of "link" (a different reference for the edit popover, so
 * a different archive), or `addAnnotation` sees a collapsed selection and
 * opens no edit dialog at all. The re-render that follows a sync also runs
 * the editable's layout effect, which writes the editor's selection back
 * into the DOM when the two differ — so a keystroke that lands inside the
 * throttle window of the previous one is silently undone. Any other
 * render that touches the editable does the same: `TestForm` validates
 * the document on every change, gated on `requestIdleCallback`, so the
 * result for a URL typed into an annotation dialog lands during a later
 * idle moment and can re-render the annotation span, which in Firefox
 * also fires a `selectionchange` that re-arms the throttle. (`TestForm`
 * aborts superseded runs, so this is at most one late render rather than
 * one per keystroke.)
 *
 * Call this between making a selection and acting on it, and between
 * consecutive selection-moving keystrokes whose outcome the test relies
 * on. It resolves once the DOM selection is the expected text, no
 * validation run is pending, and neither a `selectionchange` nor a DOM
 * mutation inside the editable has happened for longer than the throttle
 * window, which is when the trailing sync has run and no re-render is
 * about to undo it.
 */
async function waitForPortableTextSelection(text: string): Promise<void> {
  // Events before this call are not observed, so the call time stands in
  // for them: the trailing sync of an earlier event runs no later than
  // one throttle window after it, which is no later than one after now.
  let lastActivityAt = performance.now()
  const touch = () => {
    lastActivityAt = performance.now()
  }
  window.document.addEventListener('selectionchange', touch)
  const anchor = window.getSelection()?.anchorNode
  const editable =
    (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest('[data-pt-editor]') ??
    window.document.activeElement?.closest('[data-pt-editor]') ??
    null
  const observer = new MutationObserver(touch)
  if (editable) {
    observer.observe(editable, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    })
  }
  try {
    await expect
      .poll(
        () => {
          const current = window.getSelection()?.toString() ?? ''
          if (current !== text) return `DOM selection is ${JSON.stringify(current)}`
          // The render that ends the run comes first, its layout effects
          // (where the editable rewrites the DOM selection) included, and only
          // then is the marker removed: once it is gone, any effect on the
          // selection has already shown up above or in `lastActivityAt`.
          if (validationPending()) return 'validation pending'
          const quietFor = performance.now() - lastActivityAt
          return quietFor > PTE_SELECTION_THROTTLE_MS + PTE_SELECTION_SYNC_MARGIN_MS
            ? 'synced'
            : `quiet for ${Math.round(quietFor)}ms`
        },
        {interval: 25},
      )
      .toBe('synced')
  } finally {
    observer.disconnect()
    window.document.removeEventListener('selectionchange', touch)
  }
}

/** Poll `document.querySelector` until the element appears, then return it. */
async function waitForElement(selector: string): Promise<Element> {
  let el: Element | null = null
  await expect
    .poll(() => {
      el = document.querySelector(selector)
      return el
    })
    .toBeTruthy()
  return el!
}

const activatePTInputOverlay = async (fieldTestId: string) => {
  const $field = page.getByTestId(fieldTestId)
  const $overlay = $field.getByTestId('activate-overlay')
  // Only activate if the overlay is present (some inputs render already-active)
  if ($overlay.elements().length > 0) {
    const overlayEl = $overlay.element() as HTMLElement
    overlayEl.focus()
    await userEvent.keyboard(' ')
    // Wait for activation to complete: the overlay is removed once the editor
    // is active. Without this the toolbar/textbox may not be ready yet.
    await expect.element($overlay).not.toBeInTheDocument()
  }
}

export function testHelpers() {
  return {
    /**
     * Returns the DOM element of a focused Portable Text Input field ready to be typed into
     * @param testId - The data-testid attribute of the Portable Text Input
     */
    getFocusedPortableTextInput: async (testId: string) => {
      const $pteField = page.getByTestId(testId)
      await expect.element($pteField).toBeVisible()
      const $pteTextbox = $pteField.getByRole('textbox')
      await expect.element($pteTextbox).toBeVisible()
      await activatePTInputOverlay(testId)
      await $pteTextbox.element().focus()
      return $pteField
    },

    /**
     * Returns the editable element of a focused Portable Text Editor
     * @param testId - The data-testid attribute of the Portable Text Input
     */
    getFocusedPortableTextEditor: async (testId: string) => {
      const $pteField = page.getByTestId(testId)
      await expect.element($pteField).toBeVisible()
      const $pteTextbox = $pteField.getByRole('textbox')
      await expect.element($pteTextbox).toBeVisible()
      await activatePTInputOverlay(testId)
      await $pteTextbox.element().focus()
      return $pteTextbox
    },

    /**
     * Gets the modifier key to use for editor keyboard shortcuts.
     *
     * `ControlOrMeta` resolves to Cmd on macOS and Ctrl on Linux, which is what
     * Chromium and Firefox expect on both platforms. WebKit is the exception:
     * driven by the automation provider it responds to `Meta` regardless of
     * platform, so it needs special-casing (as it did in the old Playwright CT
     * helper).
     */
    getModifierKey: () => (server.browser === 'webkit' ? 'Meta' : 'ControlOrMeta'),

    /**
     * Returns an auto-waiting locator for the first element matching `selector`
     * within `parent`. Unlike `page.elementLocator(parent.element().querySelector(...))`,
     * this retries until the element appears, so it works for elements that show
     * up asynchronously (e.g. a toolbar button gaining a `[data-selected]` state
     * after a keyboard shortcut). Playwright locators auto-waited; this restores
     * that behaviour for the migrated CSS-selector lookups.
     */
    findBySelector: async (parent: {element: () => Element}, selector: string) => {
      let el: Element | null = null
      await expect
        .poll(() => {
          el = parent.element().querySelector(selector)
          return el
        })
        .toBeTruthy()
      return page.elementLocator(el!)
    },

    /**
     * Types text with a delay using userEvent.keyboard. Default delay emulates human typing.
     */
    typeWithDelay: async (input: string, delay = DEFAULT_TYPE_DELAY) => {
      for (const char of input) {
        await userEvent.keyboard(char)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    },

    /**
     * Write text into a Portable Text Editor's editable element via insertText InputEvent
     */
    insertPortableText: async (text: string, locator: {element: () => Element}) => {
      const el = locator.element()
      ;(el as HTMLElement).focus()
      el.dispatchEvent(
        new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text,
        }),
      )
      // Wait for the text to appear. Scoped to the editor because short strings also match
      // labels elsewhere on the page, such as the block style menu's "Heading 1".
      await expect.element(page.elementLocator(el).getByText(text)).toBeVisible()
    },

    /**
     * Emulate pasting HTML or text into a Portable Text Editor's editable element
     */
    insertPortableTextCopyPaste: async (htmlOrText: string, locator: {element: () => Element}) => {
      const el = locator.element()
      ;(el as HTMLElement).focus()
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('text/html', htmlOrText)
      el.dispatchEvent(
        new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertFromPaste',
          dataTransfer,
        }),
      )

      // Get first 10 chars of pasted text and wait for them to appear
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlOrText
      const firstTextContent = tempDiv?.textContent?.trim()?.slice(0, 10) || ''
      if (firstTextContent) {
        await expect.element(page.getByText(firstTextContent)).toBeVisible()
      }
    },

    /**
     * Emulate hovering a file over a Portable Text Editor
     */
    hoverFileOverPortableTextEditor: async (
      fileData: {buffer: ArrayBuffer; fileName: string; fileType: string},
      locator: {element: () => Element},
    ) => {
      const el = locator.element()
      ;(el as HTMLElement).focus()

      const blob = new Blob([fileData.buffer])
      const file = new File([blob], fileData.fileName, {type: fileData.fileType})
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      // The editor resolves the drop position from the pointer coordinates and
      // tracks it via `dragover`, so include the element-centre coordinates and
      // a cancelable `dragover` after `dragenter`.
      const box = el.getBoundingClientRect()
      const coords = {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2}
      el.dispatchEvent(new DragEvent('dragenter', {dataTransfer, bubbles: true, ...coords}))
      el.dispatchEvent(
        new DragEvent('dragover', {dataTransfer, bubbles: true, cancelable: true, ...coords}),
      )
    },

    /**
     * Emulate dropping a file over a Portable Text Editor
     */
    dropFileOverPortableTextEditor: async (
      fileData: {buffer: ArrayBuffer; fileName: string; fileType: string},
      locator: {element: () => Element},
    ) => {
      const el = locator.element()
      ;(el as HTMLElement).focus()

      const blob = new Blob([fileData.buffer])
      const file = new File([blob], fileData.fileName, {type: fileData.fileType})
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      // Track the position via `dragover` first, then drop at the same point.
      const box = el.getBoundingClientRect()
      const coords = {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2}
      el.dispatchEvent(
        new DragEvent('dragover', {dataTransfer, bubbles: true, cancelable: true, ...coords}),
      )
      el.dispatchEvent(new DragEvent('drop', {dataTransfer, bubbles: true, ...coords}))
    },

    /**
     * Emulate pasting a file over a Portable Text Editor
     */
    pasteFileOverPortableTextEditor: async (
      fileData: {buffer: ArrayBuffer; fileName: string; fileType: string},
      locator: {element: () => Element},
    ) => {
      const el = locator.element()
      ;(el as HTMLElement).focus()

      const blob = new Blob([fileData.buffer])
      const file = new File([blob], fileData.fileName, {type: fileData.fileType})
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      el.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
        }),
      )
    },

    /**
     * Toggle a keyboard hotkey combination
     */
    toggleHotkey: async (hotkey: string, modifierKey?: string) => {
      if (modifierKey) {
        await userEvent.keyboard(`{${modifierKey}>}${hotkey}{/${modifierKey}}`)
      } else {
        await userEvent.keyboard(hotkey)
      }
    },

    /**
     * Drag and drop using mouse events
     */
    dragAndDrop: async (sourceSelector: string, targetSelector: string) => {
      const source = await waitForElement(sourceSelector)
      const target = await waitForElement(targetSelector)
      // Use the provider's real pointer-driven drag (Playwright under the hood),
      // which dispatches the full hover/move/up sequence the PTE drag tracking
      // relies on. Synthetic MouseEvents don't drive it.
      await userEvent.dragAndDrop(page.elementLocator(source), page.elementLocator(target))
    },

    /**
     * Drag the source over the target without releasing, so tests can assert on
     * the in-progress drag state (e.g. a warning overlay).
     */
    dragWithoutDrop: async (sourceSelector: string, targetSelector: string) => {
      const source = await waitForElement(sourceSelector)
      const target = await waitForElement(targetSelector)
      const sourceBox = source.getBoundingClientRect()
      const targetBox = target.getBoundingClientRect()
      const at = (box: DOMRect) => ({
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2,
      })
      // Press on the source, then move the pointer over the target. Use pointer
      // events (what the drag tracking listens to) and leave the button down.
      source.dispatchEvent(
        new PointerEvent('pointerdown', {bubbles: true, button: 0, ...at(sourceBox)}),
      )
      source.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, ...at(sourceBox)}))
      target.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, ...at(targetBox)}))
      target.dispatchEvent(new PointerEvent('pointerover', {bubbles: true, ...at(targetBox)}))
    },

    /**
     * Spy on the clipboard APIs the studio actually uses and back them with an
     * in-memory store, so copy/paste round-trips without real (permission-gated,
     * non-persistent in headless) system clipboard access.
     *
     * Uses the native `ClipboardItem` (its `.types`/`.getType` work as-is) and
     * only intercepts I/O: `read`/`write`/`readText`/`writeText` plus the static
     * `ClipboardItem.supports` (which returns false for custom MIME types in the
     * test browser). Returns a `restore()` to undo the spies.
     */
    mockClipboard: () => {
      let items: ClipboardItem[] = []
      let text = ''
      const spies = [
        vi.spyOn(navigator.clipboard, 'write').mockImplementation(async (data) => {
          items = [...data]
        }),
        vi.spyOn(navigator.clipboard, 'read').mockImplementation(async () => items),
        vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(async (value) => {
          text = value
        }),
        vi.spyOn(navigator.clipboard, 'readText').mockImplementation(async () => text),
        vi.spyOn(ClipboardItem, 'supports').mockReturnValue(true),
      ]
      return {
        restore: () => spies.forEach((spy) => spy.mockRestore()),
      }
    },

    /**
     * Wait for document state to match a condition
     */
    waitForDocumentState: async (evaluateCallback: (documentState: any) => boolean) => {
      const maxWait = 5000
      const interval = 100
      let elapsed = 0

      while (elapsed < maxWait) {
        const state = (window as any).documentState
        if (evaluateCallback(state)) {
          return state
        }
        await new Promise((resolve) => setTimeout(resolve, interval))
        elapsed += interval
      }

      throw new Error('Timeout waiting for document state')
    },

    /**
     * Wait for focused node to have specific text content
     */
    waitForFocusedNodeText: async (text: string) => {
      const maxWait = 5000
      const interval = 50
      let elapsed = 0

      while (elapsed < maxWait) {
        if (window.getSelection()?.focusNode?.textContent === text) {
          return
        }
        await new Promise((resolve) => setTimeout(resolve, interval))
        elapsed += interval
      }

      throw new Error(`Timeout waiting for focused node text: "${text}"`)
    },

    waitForPortableTextSelection,

    /**
     * Extend a collapsed selection over `text` with Shift+ArrowRight (or
     * Shift+ArrowLeft with `reverse`, when the caret sits after `text`),
     * one press at a time, waiting for the editor to take each press over.
     *
     * Shift+Arrow is native selection extension; the editor only learns of it
     * through the throttled sync described on `waitForPortableTextSelection`,
     * and each sync re-renders the editable, whose layout effect writes the
     * editor's selection back into the DOM when the two differ. A press that
     * lands between a trailing sync and its render is therefore undone: with
     * four presses in one `userEvent.keyboard` call on a loaded runner, the
     * sync for "ink" renders after the fourth press has extended the DOM to
     * "link", puts "ink" back, and both settle on "ink". Pressing once per
     * sync window removes the race without changing what the test exercises.
     */
    extendPortableTextSelection: async (text: string, options: {reverse?: boolean} = {}) => {
      const {reverse = false} = options
      // The caret may still be inside the sync window of the keystroke that
      // placed it, and `TestForm` may be about to re-render with validation
      // markers for the text just typed; the first press must not race either.
      await waitForPortableTextSelection(window.getSelection()?.toString() ?? '')
      for (let count = 1; count <= text.length; count++) {
        await userEvent.keyboard(
          reverse ? '{Shift>}{ArrowLeft}{/Shift}' : '{Shift>}{ArrowRight}{/Shift}',
        )
        await waitForPortableTextSelection(reverse ? text.slice(-count) : text.slice(0, count))
      }
    },

    /**
     * Wait for selection offsets
     */
    waitForSelectionOffsets: async (offsets: {focus: number; anchor: number}, timeout = 5000) => {
      const interval = 50
      let elapsed = 0

      while (elapsed < timeout) {
        const sel = window.getSelection()
        if (offsets.focus === sel?.focusOffset && offsets.anchor === sel?.anchorOffset) {
          return
        }
        await new Promise((resolve) => setTimeout(resolve, interval))
        elapsed += interval
      }

      throw new Error(
        `Timeout waiting for selection offsets: focus=${offsets.focus}, anchor=${offsets.anchor}`,
      )
    },

    /**
     * Park the pointer and wait for Chromatic-sensitive chrome to stop moving.
     * Call at the end of a browser test (or just before `takeSnapshot`) so the
     * archive does not catch hovered controls, tooltips, style-select label
     * flicker (Normal vs No style), or floating PTE toolbars mid-layout.
     *
     * Chromatic records which elements match `:hover` / `:focus` at archive
     * time and re-applies those states when it renders the DOM, so the pointer
     * position at the end of a test is part of the snapshot.
     */
    settleChromaticEndState: async (options?: {
      styleSelectText?: RegExp
      styleSelectRoot?: string
      /**
       * Text of the single tooltip the end state is expected to show. A
       * focused icon button (e.g. the autofocused Close button of the popover
       * edit dialog) opens its tooltip after the ui-components open delay and
       * keeps it open until blur, so that tooltip is part of the archived
       * state. By default no tooltip may be visible.
       */
      expectTooltip?: RegExp
    }) => {
      if (typeof document.fonts?.ready !== 'undefined') {
        await document.fonts.ready
      }
      // The markers `TestForm` renders once its validation run finishes are
      // part of the end state.
      await expect.poll(validationPending).toBe(false)

      // Floating PTE chrome: inline-object / annotation toolbars and the
      // popover edit dialog (all positioned by Floating UI).
      const floatingSig = boxSig(
        '[data-testid="inline-object-toolbar-popover"], [data-testid="annotation-toolbar-popover"], [data-testid="popover-edit-dialog"]',
      )
      // Menus and listboxes (e.g. the comment mentions popover) are positioned
      // by Floating UI after they open.
      const menuSig = boxSig('[role="menu"], [role="listbox"]')
      // Modal `@sanity/ui` dialog cards (`nested-object-dialog`,
      // `default-edit-object-dialog`, …). Centered by CSS rather than
      // Floating UI, but their height follows the lazily rendered form inside,
      // and tests settle with them open, so they must stay open and stop
      // resizing before the archive.
      const dialogSig = boxSig('[data-ui="DialogCard"]')
      // CollapseMenu measures toolbar width asynchronously; button set /
      // x-offsets must stop moving or identical-code captures disagree on
      // overflow "..." vs inline Strong/Italic/etc.
      //
      // CollapseMenu renders its visible row only once every hidden
      // measurement row has reported an intersection, so a menu whose hidden
      // rows hold buttons while nothing is visible (and no overflow button has
      // appeared) is still measuring. Chromatic archived one such empty
      // toolbar on an identical-code run. `checkVisibility()` without
      // `visibilityProperty` counts the `visibility: hidden` measurement rows,
      // so only truly visible buttons go into the signature and a measuring
      // menu yields a fresh symbol that can never read as stable.
      const toolbarSig = (): string | symbol => {
        const toolbars = Array.from(
          window.document.querySelectorAll<HTMLElement>('[data-testid="pt-editor__toolbar-card"]'),
        ).filter(isShown)
        const measuring = toolbars.some((toolbar) =>
          Array.from(toolbar.querySelectorAll<HTMLElement>('[data-ui="CollapseMenu"]'))
            .filter(isShown)
            .some(
              (menu) =>
                menu.querySelectorAll('[data-hidden] button').length > 0 &&
                !Array.from(menu.querySelectorAll('button')).some(isShown),
            ),
        )
        if (measuring) return Symbol('collapse menu measuring')
        return toolbars
          .map((toolbar) =>
            Array.from(toolbar.querySelectorAll('button'))
              .filter(isShown)
              .map((btn) => {
                const label =
                  btn.getAttribute('aria-label')?.trim() || btn.textContent?.trim() || ''
                return `${label}@${Math.round(btn.getBoundingClientRect().x)}`
              })
              .join(','),
          )
          .join('||')
      }

      // Overlays that are open when settling starts must still be open after
      // the pointer has moved: record them before parking so a popover that
      // closes under the park is a timeout below, not a silently archived
      // closed state.
      const hadFloating = Boolean(floatingSig())
      const hadMenu = Boolean(menuSig())
      const hadDialog = Boolean(dialogSig())
      const hadToolbar = Boolean(toolbarSig())

      // After `userEvent.click` the real pointer still sits on the clicked
      // control, so it (and its field header) stay `:hover`ed and tooltips
      // can open. Synthetic `mouseover` does not clear CSS `:hover`; only a
      // real pointer move does. Park it on a transparent element in the
      // bottom-right corner, then assert the rendered tree is hover-free and
      // that React hover state (field actions) has flushed.
      const park = await parkPointer()
      if (server.browser === 'webkit') await reenterStaleWebkitHover(park)
      const parkedAt = performance.now()
      const hovered = () => hoveredOutside(park).map(describeElement)
      await expect.poll(hovered).toEqual([])

      await expectStable(fieldActionsSig, 2)

      // `@sanity/ui` tooltips open on hover *or focus* of their trigger, after
      // the ui-components open delay, and close on mouseleave / blur. Parking
      // cancels hover timers, but a trigger focused before the park — by the
      // test, or by React between the start of settling and the park (a
      // dialog autofocusing its Close button, focus restored on close) —
      // still opens its tooltip up to `TOOLTIP_DELAY_PROPS.open` later, so a
      // single zero reading proves nothing: the count must hold at zero for
      // longer than that delay, measured from the park, the last trigger event
      // this helper controls (the font wait above must not eat into it). A
      // test whose end state legitimately shows a focus tooltip declares it
      // with `expectTooltip`, and that one tooltip must then be the only one
      // and stop moving like the other floating chrome.
      const tooltipSig = boxSig('[data-ui="Tooltip"]')
      const expectedTooltip = options?.expectTooltip
      // Firefox headless shares one window focus across the pages parallel
      // test files run in, so a focus-driven tooltip is not deterministic
      // there; Chromatic archives on chromium only.
      const verifyExpectedTooltip = expectedTooltip && server.browser !== 'firefox'
      if (verifyExpectedTooltip) {
        await expect
          .poll(() => visibleTooltips().map((el) => el.textContent?.trim() ?? ''))
          .toEqual([expect.stringMatching(expectedTooltip)])
        await expectStable(present(tooltipSig))
      } else if (!expectedTooltip) {
        let tooltipFreeSince = parkedAt
        await expect
          .poll(() => {
            if (visibleTooltips().length > 0) {
              tooltipFreeSince = performance.now()
              return false
            }
            return performance.now() - tooltipFreeSince >= TOOLTIP_FREE_WINDOW_MS
          })
          .toBe(true)
      }

      // Style-select label (Normal ↔ No style) must stay on the expected text
      // for the whole stability window — matching once then stabilizing on a
      // flipped label was a pairwise Chromatic false diff.
      const styleSelectEl = () => {
        const root = options?.styleSelectRoot
        const select = root
          ? window.document.querySelector(`${root} [data-testid="block-style-select"]`)
          : window.document.querySelector('[data-testid="block-style-select"]')
        return select instanceof HTMLElement ? select : null
      }
      const styleSig = () => {
        const select = styleSelectEl()
        if (!select) return ''
        return `${select.textContent?.trim()}@${Math.round(select.getBoundingClientRect().x)}`
      }
      if (options?.styleSelectText || styleSig()) {
        const required = options?.styleSelectText
        let previous = ''
        let stable = 0
        await expect
          .poll(() => {
            const select = styleSelectEl()
            const text = select?.textContent?.trim() ?? ''
            if (required && !required.test(text)) {
              previous = ''
              stable = 0
              return false
            }
            const next = styleSig()
            if (next && next === previous) stable += 1
            else {
              previous = next
              stable = 0
            }
            return stable >= 3
          })
          .toBe(true)
      }

      // Floating chrome, menus, dialogs and the PTE toolbar must stop moving —
      // and, if they were open before parking, must still be open. An empty
      // signature (hidden or unmounted) never counts as stable, so a popover
      // that closes under the parked pointer times out here instead of being
      // archived silently.
      const settleFloating = hadFloating || Boolean(floatingSig())
      const settleMenu = hadMenu || Boolean(menuSig())
      const settleDialog = hadDialog || Boolean(dialogSig())
      if (settleFloating) await expectStable(present(floatingSig), 2)
      if (settleMenu) await expectStable(present(menuSig))
      if (settleDialog) await expectStable(present(dialogSig), 2)
      if (hadToolbar || toolbarSig()) await expectStable(present(toolbarSig))

      // Snap after geometry has settled so the archive cannot land on a
      // half-pixel Floating UI translate that differs across identical runs.
      // The snap writes inline styles, which can cost one more layout pass, so
      // the snapped chrome must be re-read as stable before returning.
      snapFloatingUiToIntegerPixels()
      if (settleFloating) await expectStable(present(floatingSig), 2)
      if (settleMenu) await expectStable(present(menuSig))
      if (verifyExpectedTooltip) await expectStable(present(tooltipSig))
    },
  }
}
