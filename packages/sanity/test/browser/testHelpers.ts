import {expect, vi} from 'vitest'
import {page, server, userEvent} from 'vitest/browser'

const DEFAULT_TYPE_DELAY = 20

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

export function removePointerPark(): void {
  window.document.querySelector(`[data-testid="${POINTER_PARK_TESTID}"]`)?.remove()
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
    }) => {
      if (typeof document.fonts?.ready !== 'undefined') {
        await document.fonts.ready
      }

      // After `userEvent.click` the real pointer still sits on the clicked
      // control, so it (and its field header) stay `:hover`ed and tooltips
      // can open. Synthetic `mouseover` does not clear CSS `:hover`; only a
      // real pointer move does. Park it on a transparent element in the
      // bottom-right corner, then assert the rendered tree is hover-free and
      // that React hover state (field actions) has flushed.
      const park = getPointerPark()
      await userEvent.hover(park)
      const hovered = () =>
        Array.from(window.document.querySelectorAll(':hover'))
          .filter(
            (el) =>
              el !== window.document.documentElement && el !== window.document.body && el !== park,
          )
          .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`)
      await expect.poll(hovered).toEqual([])

      const fieldActionsSig = () =>
        Array.from(window.document.querySelectorAll('[data-actions-visible]'))
          .map((el) => el.getAttribute('data-actions-visible'))
          .join(',')
      await expectStable(fieldActionsSig, 2)

      await expect
        .poll(
          () =>
            Array.from(window.document.querySelectorAll('[data-ui="Tooltip"]')).filter(
              (el) => el instanceof HTMLElement && el.checkVisibility(),
            ).length,
        )
        .toBe(0)

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

      // Floating chrome that was open when settling started must still be open
      // and must stop moving. An empty signature (hidden or unmounted) never
      // counts as stable, so a popover that closes under the parked pointer
      // times out here instead of being archived silently.
      const present = (sig: () => string) => () => sig() || Symbol('absent')

      const floatingSig = () =>
        Array.from(
          window.document.querySelectorAll<HTMLElement>(
            '[data-testid="inline-object-toolbar-popover"], [data-testid="annotation-toolbar-popover"]',
          ),
        )
          .filter((el) => el.checkVisibility())
          .map((el) => {
            const r = el.getBoundingClientRect()
            return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}`
          })
          .join('|')
      if (floatingSig()) await expectStable(present(floatingSig), 2)

      // Menus and listboxes (e.g. the comment mentions popover) are positioned
      // by Floating UI after they open; wait for their box to stop changing.
      const menuSig = () =>
        Array.from(window.document.querySelectorAll<HTMLElement>('[role="menu"], [role="listbox"]'))
          .filter((el) => el.checkVisibility())
          .map((el) => {
            const r = el.getBoundingClientRect()
            return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)}`
          })
          .join('|')
      if (menuSig()) await expectStable(present(menuSig))

      // CollapseMenu measures toolbar width asynchronously; button set /
      // x-offsets must stop moving or identical-code captures disagree on
      // overflow "..." vs inline Strong/Italic/etc.
      const toolbarSig = () =>
        Array.from(
          window.document.querySelectorAll<HTMLElement>('[data-testid="pt-editor__toolbar-card"]'),
        )
          .filter((el) => el.checkVisibility())
          .map((toolbar) =>
            Array.from(toolbar.querySelectorAll('button'))
              .filter((btn) => btn instanceof HTMLElement && btn.checkVisibility())
              .map((btn) => {
                const label =
                  btn.getAttribute('aria-label')?.trim() || btn.textContent?.trim() || ''
                return `${label}@${Math.round(btn.getBoundingClientRect().x)}`
              })
              .join(','),
          )
          .join('||')
      if (toolbarSig()) await expectStable(present(toolbarSig))

      // Snap after geometry has settled so the archive cannot land on a
      // half-pixel Floating UI translate that differs across identical runs.
      snapFloatingUiToIntegerPixels()
    },
  }
}
