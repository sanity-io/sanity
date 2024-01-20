import {type ComponentFixtures} from '@playwright/experimental-ct-react'
import {type Locator, type PlaywrightTestArgs} from '@playwright/test'

export const DEFAULT_TYPE_DELAY = 20

/**
 * The delay between key presses in milliseconds for fast typing. This is usually used for typing in the PTE.
 * The PTE normally need some time to process the input and sync its internal state with the document
 */
export const TYPE_DELAY_HIGH = 150

export type MountResult = Awaited<ReturnType<ComponentFixtures['mount']>>

export function testHelpers({page}: {page: PlaywrightTestArgs['page']}) {
  const activatePTInputOverlay = async ($pteField: Locator) => {
    const $overlay = $pteField.getByTestId('activate-overlay')
    if (await $overlay.isVisible()) {
      await $overlay.focus()
      await page.keyboard.press('Space')
    }
    await $pteField
      .locator(`[data-testid='pt-editor__toolbar-card']`)
      .waitFor({state: 'visible', timeout: 1000})
  }
  return {
    /**
     * Returns the DOM element of a focused Portable Text Input ready to typed into
     *
     * @param testId The data-testid attribute of the Portable Text Input
     * @returns The Portable Text Input element
     */
    getFocusedPortableTextInput: async (testId: string) => {
      // Wait for field to get ready (without this tests fails randomly on Webkit)
      await page.locator(`[data-testid='${testId}']`).waitFor()
      const $pteField: Locator = page.getByTestId(testId)
      // Activate the input if needed
      await activatePTInputOverlay($pteField)
      // Ensure focus on the contentEditable element of the Portable Text Editor
      const $pteTextbox = $pteField.getByRole('textbox')
      await $pteTextbox.isEditable()
      await $pteTextbox.focus()
      return $pteField
    },
    /**
     * Returns the editable element of a focused Portable Text Input
     * This can receive events to simulate user action, or be tested for
     * having the right content.
     *
     * @param testId - The data-testid attribute of the Portable Text Input.
     * @returns The PT-editor's contentEditable element
     */
    getFocusedPortableTextEditor: async (testId: string) => {
      // Wait for field to get ready (without this tests fails randomly on Webkit)
      await page.locator(`[data-testid='${testId}']`).waitFor()
      const $pteField: Locator = page.getByTestId(testId)
      // Activate the input if needed
      await activatePTInputOverlay($pteField)
      // Ensure focus on the contentEditable element of the Portable Text Editor
      const $pteTextbox = $pteField.getByRole('textbox')
      await $pteTextbox.isEditable()
      await $pteTextbox.focus()
      return $pteTextbox
    },
    /**
     * Gets the appropriate modifier key for the current platform.
     * @returns The modifier key name ('Meta' for macOS, 'Control' for other platforms).
     */
    getModifierKey: () => {
      if (process.platform === 'darwin') {
        return 'Meta'
      }
      return 'Control'
    },
    /**
     * Types text with a delay using `page.keyboard.type`. Default delay emulates a human typing.
     * @param input - The text to be typed.
     * @param delay - (Optional) The delay between key presses in milliseconds.
     */
    typeWithDelay: async (input: string, delay?: number) => {
      await page.keyboard.type(input, {delay: delay || DEFAULT_TYPE_DELAY})
    },
    /**
     * Write text into a Portable Text Editor's editable element
     * @param text - The text to be typed.
     * @param locator - editable element of a Portable Text Editor (as returned by getFocusedPortableTextEditorElement)
     */
    insertPortableText: async (text: string, locator: Locator) => {
      await locator.focus()
      await locator.evaluate((el, value) => {
        el.dispatchEvent(
          new window.InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: value,
          }),
        )
      }, text)
      await locator.getByText(text).waitFor()
    },
    /**
     * Emulate pasting HTML or text into a Portable Text Editor's editable element
     * @param text - The string to be pasted.
     * @param locator - editable element of a Portable Text Editor (as returned by getFocusedPortableTextEditorElement)
     */
    insertPortableTextCopyPaste: async (htmlOrText: string, locator: Locator) => {
      await locator.focus()
      await locator.evaluate((el, value) => {
        const dataTransfer = new DataTransfer()
        dataTransfer.setData('text/html', value)
        el.dispatchEvent(
          new window.InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertFromPaste',
            dataTransfer,
          }),
        )
      }, htmlOrText)

      // We get the first 10 chars of the pasted text and wait for them to appear in the editor
      const firstTextContent = await page.evaluate((value) => {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = value
        return tempDiv?.textContent?.trim()?.slice(0, 10) || ''
      }, htmlOrText)

      await locator.getByText(firstTextContent).waitFor()
    },
    /**
     * Will create a keyboard event of a given hotkey combination that can be activated with a modifier key
     * @param hotkey - the hotkey
     * @param modifierKey - the modifier key (if any) that can activate the hotkey
     */
    toggleHotkey: async (hotkey: string, modifierKey?: string) => {
      await page.keyboard.press(modifierKey ? `${modifierKey}+${hotkey}` : hotkey)
    },
    /**
     * Will wait for the documentState evaulate callback to be true before the docmueentState is returned
     * @param evaluteCallback - the callback that will be evaluated
     */
    waitForDocumentState: async (evaluateCallback: (documentState: any) => boolean) => {
      await page.exposeFunction('evaluateCallback', evaluateCallback)
      const documentState = await page.evaluate<Promise<any>>(async () => {
        const waitForCondition = () => {
          return new Promise((resolve, reject) => {
            const checkCondition = async () => {
              try {
                if (await evaluateCallback(window.documentState)) {
                  resolve(window.documentState)
                } else {
                  setTimeout(checkCondition, 100)
                }
              } catch (error) {
                reject(error)
              }
            }

            // Timeout after 5 seconds
            const timeout = setTimeout(() => {
              reject(new Error('Timeout waiting for condition'))
            }, 5000)

            checkCondition()

            return () => clearTimeout(timeout)
          })
        }

        return waitForCondition()
      })

      return documentState
    },
  }
}
