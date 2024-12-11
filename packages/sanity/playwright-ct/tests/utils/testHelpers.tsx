import {readFileSync} from 'node:fs'
import path from 'node:path'

import {expect, type Locator, type PlaywrightTestArgs} from '@playwright/test'

export const DEFAULT_TYPE_DELAY = 20

export function testHelpers({page}: {page: PlaywrightTestArgs['page']}) {
  const activatePTInputOverlay = async ($pteField: Locator) => {
    const $overlay = $pteField.getByTestId('activate-overlay')
    if (await $overlay.isVisible()) {
      await $overlay.focus()
      await $overlay.press('Space')
    }

    await expect($overlay).not.toBeVisible({timeout: 1500})
  }
  return {
    /**
     * Drags and drops the source element to the target element position
     *
     * @param testId The data-testid attribute of the Portable Text Input
     * @returns The Portable Text Input element
     */
    dragAndDrop: async (sourceSelector: string, targetSelector: string) => {
      const source = await page.locator(sourceSelector)
      const target = await page.locator(targetSelector)

      const box = await source.boundingBox()
      if (box) {
        const {x, y, width, height} = box
        await page.mouse.move(x + width / 2, y + height / 2)
        await page.mouse.down()
      }

      const targetBox = await target.boundingBox()
      if (targetBox) {
        const {x, y, width, height} = targetBox
        await page.mouse.move(x + width / 2, y + height / 2)
        await page.mouse.up()
      }
    },
    /**
     * Drags the source element to the target element position without dropping
     *
     * @param testId The data-testid attribute of the Portable Text Input
     * @returns The Portable Text Input element
     */
    dragWithoutDrop: async (sourceSelector: string, targetSelector: string) => {
      const source = await page.locator(sourceSelector)
      const target = await page.locator(targetSelector)

      const box = await source.boundingBox()
      if (box) {
        const {x, y, width, height} = box
        await page.mouse.move(x + width / 2, y + height / 2)
        await page.mouse.down()
      }

      const targetBox = await target.boundingBox()
      if (targetBox) {
        const {x, y, width, height} = targetBox
        await page.mouse.move(x + width / 2, y + height / 2)
      }
    },
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
    getModifierKey: (options?: {browserName?: string}) => {
      // There's a bug with Firefox and Chromium on macOS where it use 'Control' instead of 'Meta' inside Playwright for some reason
      if (
        process.platform === 'darwin' &&
        options?.browserName &&
        ['chromium', 'firefox'].includes(options.browserName)
      ) {
        return 'Control'
      }
      // Webkit on Linux uses 'Meta' instead of 'Control' as the modifier key for some reason
      if (process.platform === 'linux' && options?.browserName === 'webkit') {
        return 'Meta'
      }
      return 'ControlOrMeta'
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
     * Emulate dragging a file over an focused Portable Text Editor's editable element
     * @param text - The string to be pasted.
     * @param locator - editable element of a Portable Text Editor (as returned by getFocusedPortableTextEditorElement)
     */
    hoverFileOverPortableTextEditor: async (
      filePath: string,
      fileType: string,
      locator: Locator,
    ) => {
      const fileName = path.basename(filePath)
      const buffer = readFileSync(filePath).toString('base64')

      await locator.focus()
      await locator.evaluate(
        async (el, {bufferData, localFileName, localFileType}) => {
          const response = await fetch(bufferData)
          const blob = await response.blob()

          const image = new File([blob], localFileName, {type: localFileType})

          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(image)

          el.dispatchEvent(
            new DragEvent('dragenter', {
              dataTransfer,
              bubbles: true,
            }),
          )
        },
        {
          bufferData: `data:application/octet-stream;base64,${buffer}`,
          localFileName: fileName,
          localFileType: fileType,
        },
      )
    },
    /**
     * Emulate dropping a file over an focused Portable Text Editor's editable element
     * @param filePath - Absolute path to the file to be dropped.
     * @param fileType - Mime type of the file to be dropped.
     * @param locator - editable element of a Portable Text Editor (as returned by getFocusedPortableTextEditorElement)
     */
    dropFileOverPortableTextEditor: async (
      imagePath: string,
      fileType: string,
      locator: Locator,
    ) => {
      const fileName = path.basename(imagePath)
      const buffer = readFileSync(imagePath).toString('base64')

      await locator.focus()
      await locator.evaluate(
        async (el, {bufferData, localFileName, localFileType}) => {
          const response = await fetch(bufferData)
          const blob = await response.blob()
          const image = new File([blob], localFileName, {type: localFileType})

          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(image)

          el.dispatchEvent(
            new DragEvent('drop', {
              dataTransfer,
              bubbles: true,
            }),
          )
        },
        {
          bufferData: `data:application/octet-stream;base64,${buffer}`,
          localFileName: fileName,
          localFileType: fileType,
        },
      )
    },
    /**
     * Emulate pasting a file over an focused Portable Text Editor's editable element
     * @param filePath - Absolute path to the file to be pasted.
     * @param fileType - Mime type of the file to be pasted.
     * @param locator - editable element of a Portable Text Editor (as returned by getFocusedPortableTextEditorElement)
     */
    pasteFileOverPortableTextEditor: async (
      filePath: string,
      fileType: string,
      locator: Locator,
    ) => {
      const fileName = path.basename(filePath)
      const buffer = readFileSync(filePath).toString('base64')

      await locator.focus()
      await locator.evaluate(
        async (el, {bufferData, localFileName, localFileType}) => {
          const response = await fetch(bufferData)
          const blob = await response.blob()
          const image = new File([blob], localFileName, {type: localFileType})

          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(image)

          el.dispatchEvent(
            new ClipboardEvent('paste', {
              clipboardData: dataTransfer,
              bubbles: true,
            }),
          )
        },
        {
          bufferData: `data:application/octet-stream;base64,${buffer}`,
          localFileName: fileName,
          localFileType: fileType,
        },
      )
    },
    /**
     * Will create a keyboard event of a given hotkey combination that can be activated with a modifier key
     * @param hotkey - the hotkey
     * @param modifierKey - the modifier key (if any) that can activate the hotkey
     */
    toggleHotkey: async (hotkey: string, modifierKey?: string) => {
      await page.keyboard.press(modifierKey ? `${modifierKey}+${hotkey}` : hotkey)
    },
    mockClipboard: async () => {
      await page.evaluate(() => {
        const clipboardData = {text: ''}

        // Mock the clipboard writeText method
        navigator.clipboard.writeText = async (text) => {
          clipboardData.text = text
          return Promise.resolve()
        }

        // Mock the clipboard readText method
        navigator.clipboard.readText = async () => {
          return Promise.resolve(clipboardData.text)
        }
      })
    },
    setClipboardText: async (text: string) => {
      await page.evaluate((checkText) => {
        navigator.clipboard.writeText(checkText)
      }, text)
    },

    getClipboardText: async () => {
      return await page.evaluate(() => {
        return navigator.clipboard.readText()
      })
    },
    hasClipboardText: async (text: string) => {
      const value = await page.evaluate(() => {
        return navigator.clipboard.readText()
      })

      return value === text
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
