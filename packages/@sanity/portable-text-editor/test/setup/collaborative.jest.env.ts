import {chromium, Browser, Page, ElementHandle, BrowserContext} from '@playwright/test'
import NodeEnvironment from 'jest-environment-node'
import {isEqual} from 'lodash'
import ipc from 'node-ipc'
import {PortableTextBlock} from '@sanity/types'
import {normalizeSelection} from '../../src/utils/selection'
import type {EditorSelection} from '../../src'

ipc.config.id = 'collaborative-jest-environment-ipc-client'
ipc.config.retry = 5000
ipc.config.networkPort = 3002
ipc.config.silent = true

const WEB_SERVER_ROOT_URL = 'http://localhost:3000'

// Forward debug info from the PTE in the browsers
// const DEBUG = 'sanity-pte:*'
// eslint-disable-next-line no-process-env
const DEBUG = process.env.DEBUG || false

// Wait this long for selections to appear in the browser
// This should be set high to support slower host systems.
const SELECTION_TIMEOUT_MS = 5000

// How long to wait for a new revision to come back to the client(s) when patched through the server.
// This should be set high to support slower host systems.
const REVISION_TIMEOUT_MS = 5000

export default class CollaborationEnvironment extends NodeEnvironment {
  private _browserA?: Browser
  private _browserB?: Browser
  private _pageA?: Page
  private _pageB?: Page
  private _contextA?: BrowserContext
  private _contextB?: BrowserContext

  // Saving these setup/teardown functions here for future reference.
  // public async setup(): Promise<void> {
  //   await super.setup()
  // }
  // public async teardown(): Promise<void> {
  //   await super.teardown()
  // }

  public async handleTestEvent(event: {name: string}): Promise<void> {
    if (event.name === 'run_start') {
      await this._setupInstance()
    }
    if (event.name == 'test_start') {
      await this._createNewTestPage()
    }
    if (event.name === 'run_finish') {
      await this._destroyInstance()
    }
  }

  private async _setupInstance(): Promise<void> {
    ipc.connectToNet('socketServer')
    this._browserA = await chromium.launch()
    this._browserB = await chromium.launch()
    const contextA = await this._browserA.newContext()
    const contextB = await this._browserB.newContext()
    await contextA.grantPermissions(['clipboard-read', 'clipboard-write'])
    await contextB.grantPermissions(['clipboard-read', 'clipboard-write'])
    this._contextA = contextA
    this._contextB = contextB
    this._pageA = await this._contextA.newPage()
    this._pageB = await this._contextB.newPage()
  }

  private async _destroyInstance(): Promise<void> {
    await this._pageA?.close()
    await this._pageB?.close()
    await this._browserA?.close()
    await this._browserB?.close()
    ipc.disconnect('socketServer')
  }

  private async _createNewTestPage(): Promise<void> {
    if (!this._pageA || !this._pageB) {
      throw new Error('Page not initialized')
    }

    // This will identify this test throughout the web environment
    const testId = (Math.random() + 1).toString(36).substring(7)

    // Hook up page console and npm debug in the PTE
    if (DEBUG) {
      await this._pageA.addInitScript((filter: string) => {
        window.localStorage.debug = filter
      }, DEBUG)
      await this._pageB.addInitScript((filter: string) => {
        window.localStorage.debug = filter
      }, DEBUG)
      this._pageA.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`A:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`),
      )
      this._pageB.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`B:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`),
      )
    }
    this._pageA.on('pageerror', (err) => {
      console.error('Editor A crashed', err)
      throw err
    })
    this._pageB.on('pageerror', (err) => {
      console.error('Editor B crashed', err)
      throw err
    })

    this.global.setDocumentValue = async (
      value: PortableTextBlock[] | undefined,
    ): Promise<void> => {
      const revId = (Math.random() + 1).toString(36).substring(7)
      ipc.of.socketServer.emit('payload', JSON.stringify({type: 'value', value, testId, revId}))
      await this._pageA?.waitForSelector(`code[data-rev-id="${revId}"]`, {
        timeout: REVISION_TIMEOUT_MS,
      })
      await this._pageB?.waitForSelector(`code[data-rev-id="${revId}"]`, {
        timeout: REVISION_TIMEOUT_MS,
      })
    }

    this.global.getEditors = () =>
      Promise.all(
        [this._pageA!, this._pageB!].map(async (page, index) => {
          const userAgent = await page.evaluate(() => navigator.userAgent)
          const isMac = /Mac|iPod|iPhone|iPad/.test(userAgent)
          const metaKey = isMac ? 'Meta' : 'Control'
          const editorId = `${['A', 'B'][index]}${testId}`
          const [
            editableHandle,
            selectionHandle,
            valueHandle,
            revIdHandle,
          ]: (ElementHandle<Element> | null)[] = await Promise.all([
            page.waitForSelector('div[contentEditable="true"]'),
            page.waitForSelector('#pte-selection'),
            page.waitForSelector('#pte-value'),
            page.waitForSelector('#pte-revId'),
          ])

          if (!editableHandle || !selectionHandle || !valueHandle || !revIdHandle) {
            throw new Error('Failed to find required editor elements')
          }

          const waitForRevision = async (mutatingFunction?: () => Promise<void>) => {
            if (mutatingFunction) {
              const currentRevId = await revIdHandle.evaluate((node) =>
                node instanceof HTMLElement && node.innerText
                  ? JSON.parse(node.innerText)?.revId
                  : null,
              )
              await mutatingFunction()
              await page.waitForSelector(`code[data-rev-id]:not([data-rev-id='${currentRevId}'])`, {
                timeout: REVISION_TIMEOUT_MS,
              })
            }
          }

          const getSelection = async (): Promise<EditorSelection | null> => {
            const selection = await selectionHandle.evaluate((node) =>
              node instanceof HTMLElement && node.innerText ? JSON.parse(node.innerText) : null,
            )
            return selection
          }
          const waitForNewSelection = async (selectionChangeFn: () => Promise<void>) => {
            const oldSelection = await getSelection()
            const dataVal = oldSelection ? JSON.stringify(oldSelection) : 'null'
            await selectionChangeFn()
            await page.waitForSelector(`code[data-selection]:not([data-selection='${dataVal}'])`, {
              timeout: SELECTION_TIMEOUT_MS,
            })
          }

          const waitForSelection = async (selection: EditorSelection) => {
            const value = await valueHandle.evaluate((node): PortableTextBlock[] | undefined =>
              node instanceof HTMLElement && node.innerText
                ? JSON.parse(node.innerText)
                : undefined,
            )
            const normalized = normalizeSelection(selection, value)
            const dataVal = JSON.stringify(normalized)
            await page.waitForSelector(`code[data-selection='${dataVal}']`, {
              timeout: SELECTION_TIMEOUT_MS,
            })
          }
          return {
            testId,
            editorId,
            insertText: async (text: string) => {
              await editableHandle.focus()
              await waitForRevision(async () => {
                await editableHandle.evaluate(
                  (node, args) => {
                    node.dispatchEvent(
                      new InputEvent('beforeinput', {
                        bubbles: true,
                        cancelable: true,
                        inputType: 'insertText',
                        data: args[0],
                      }),
                    )
                  },
                  [text],
                )
              })
            },
            undo: async () => {
              await waitForRevision(async () => {
                await editableHandle.focus()
                await page.keyboard.down(metaKey)
                await page.keyboard.press('z')
                await page.keyboard.up(metaKey)
              })
            },
            redo: async () => {
              await waitForRevision(async () => {
                await editableHandle.focus()
                await page.keyboard.down(metaKey)
                await page.keyboard.press('y')
                await page.keyboard.up(metaKey)
              })
            },
            paste: async (string: string, type = 'text/plain') => {
              // Write text to native clipboard
              await page.evaluate(
                async ({string: _string, type: _type}) => {
                  await navigator.clipboard.writeText('') // Clear first
                  const blob = new Blob([_string], {type: _type})
                  const data = [new ClipboardItem({[_type]: blob})]
                  await navigator.clipboard.write(data)
                },
                {string, type},
              )
              await waitForRevision(async () => {
                // Simulate paste key command
                await page.keyboard.down(metaKey)
                await page.keyboard.press('v')
                await page.keyboard.up(metaKey)
              })
            },
            pressKey: async (keyName: string, times?: number) => {
              const pressKey = async () => {
                await editableHandle.press(keyName)
              }
              for (let i = 0; i < (times || 1); i++) {
                // Value manipulation keys
                if (
                  keyName.length === 1 ||
                  keyName === 'Backspace' ||
                  keyName === 'Delete' ||
                  keyName === 'Enter'
                ) {
                  await waitForRevision(async () => {
                    await pressKey()
                  })
                } else if (
                  // Selection manipulation keys
                  [
                    'ArrowUp',
                    'ArrowDown',
                    'ArrowLeft',
                    'ArrowRight',
                    'PageUp',
                    'PageDown',
                    'Home',
                    'End',
                  ].includes(keyName)
                ) {
                  await waitForNewSelection(pressKey)
                } else {
                  // Unknown keys, test needs should be covered by the above cases.
                  console.warn(`Key ${keyName} not accounted for`)
                  await pressKey()
                }
              }
            },
            toggleMark: async (hotkey: string) => {
              const selection = await selectionHandle.evaluate((node) =>
                node instanceof HTMLElement && node.innerText ? JSON.parse(node.innerText) : null,
              )
              const performKeyPress = async () => {
                await page.keyboard.down(metaKey)
                await page.keyboard.down(hotkey)

                await page.keyboard.up(hotkey)
                await page.keyboard.up(metaKey)
              }
              if (selection && isEqual(selection.focus, selection.anchor)) {
                await performKeyPress()
              } else {
                await waitForRevision(performKeyPress)
              }
            },
            focus: async () => {
              await editableHandle.focus()
            },
            setSelection: async (selection: EditorSelection | null) => {
              ipc.of.socketServer.emit(
                'payload',
                JSON.stringify({
                  type: 'selection',
                  selection,
                  testId,
                  editorId,
                }),
              )
              await waitForSelection(selection)
            },
            async getValue(): Promise<PortableTextBlock[] | undefined> {
              const value = await valueHandle.evaluate((node): PortableTextBlock[] | undefined =>
                node instanceof HTMLElement && node.innerText
                  ? JSON.parse(node.innerText)
                  : undefined,
              )
              return value
            },
            getSelection,
          }
        }),
      )

    // Open up the test documents
    await this._pageA?.goto(`${WEB_SERVER_ROOT_URL}?editorId=A${testId}&testId=${testId}`, {
      waitUntil: 'load',
    })
    await this._pageB?.goto(`${WEB_SERVER_ROOT_URL}?editorId=B${testId}&testId=${testId}`, {
      waitUntil: 'load',
    })
  }
}
