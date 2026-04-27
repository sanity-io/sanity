import {page, userEvent} from 'vitest/browser'

const DEFAULT_TYPE_DELAY = 20

const activatePTInputOverlay = async (fieldTestId: string) => {
  const $overlay = page.getByTestId('activate-overlay')
  // Check if overlay exists and is visible
  const elements = $overlay.elements()
  if (elements.length > 0) {
    const field = page.getByTestId(fieldTestId)
    const overlay = field.getByTestId('activate-overlay')
    const overlayElements = overlay.elements()
    if (overlayElements.length > 0) {
      await overlay.element().focus()
      await userEvent.keyboard(' ')
    }
  }
}

export function testHelpers() {
  return {
    /**
     * Returns the DOM element of a focused Portable Text Input field ready to be typed into
     * @param testId The data-testid attribute of the Portable Text Input
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
     * @param testId The data-testid attribute of the Portable Text Input
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
     * Gets the appropriate modifier key for the current platform.
     */
    getModifierKey: () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      return isMac ? 'Meta' : 'Control'
    },

    /**
     * Types text with a delay using userEvent.keyboard. Default delay emulates human typing.
     */
    typeWithDelay: async (input: string, delay?: number) => {
      for (const char of input) {
        await userEvent.keyboard(char)
        if (delay || DEFAULT_TYPE_DELAY) {
          await new Promise((resolve) => setTimeout(resolve, delay || DEFAULT_TYPE_DELAY))
        }
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
    insertPortableTextCopyPaste: async (
      htmlOrText: string,
      locator: {element: () => Element},
    ) => {
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

      el.dispatchEvent(
        new DragEvent('dragenter', {
          dataTransfer,
          bubbles: true,
        }),
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

      el.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
          bubbles: true,
        }),
      )
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
      const source = document.querySelector(sourceSelector)
      const target = document.querySelector(targetSelector)
      if (!source || !target) return

      const sourceBox = source.getBoundingClientRect()
      const targetBox = target.getBoundingClientRect()

      // Simulate drag start
      source.dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: sourceBox.x + sourceBox.width / 2,
          clientY: sourceBox.y + sourceBox.height / 2,
          bubbles: true,
        }),
      )
      source.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: sourceBox.x + sourceBox.width / 2 + 10,
          clientY: sourceBox.y + sourceBox.height / 2 + 10,
          bubbles: true,
        }),
      )

      // Move to target
      target.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: targetBox.x + targetBox.width / 2,
          clientY: targetBox.y + targetBox.height / 2,
          bubbles: true,
        }),
      )

      // Drop
      target.dispatchEvent(
        new MouseEvent('mouseup', {
          clientX: targetBox.x + targetBox.width / 2,
          clientY: targetBox.y + targetBox.height / 2,
          bubbles: true,
        }),
      )
    },

    /**
     * Drag without dropping
     */
    dragWithoutDrop: async (sourceSelector: string, targetSelector: string) => {
      const source = document.querySelector(sourceSelector)
      const target = document.querySelector(targetSelector)
      if (!source || !target) return

      const sourceBox = source.getBoundingClientRect()
      const targetBox = target.getBoundingClientRect()

      source.dispatchEvent(
        new MouseEvent('mousedown', {
          clientX: sourceBox.x + sourceBox.width / 2,
          clientY: sourceBox.y + sourceBox.height / 2,
          bubbles: true,
        }),
      )

      target.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: targetBox.x + targetBox.width / 2,
          clientY: targetBox.y + targetBox.height / 2,
          bubbles: true,
        }),
      )
    },

    /**
     * Set up a mock clipboard
     */
    mockClipboard: () => {
      const clipboardData = {text: ''}

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            clipboardData.text = text
          },
          readText: async () => clipboardData.text,
        },
        writable: true,
      })
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
    waitForSelectionOffsets: async (
      offsets: {focus: number; anchor: number},
      timeout = 5000,
    ) => {
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
