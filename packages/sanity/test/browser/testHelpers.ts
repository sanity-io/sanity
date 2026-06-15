import {expect, vi} from 'vitest'
import {page, server, userEvent} from 'vitest/browser'

const DEFAULT_TYPE_DELAY = 20

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
      // Wait for the text to appear
      await expect.element(page.getByText(text)).toBeVisible()
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
  }
}
