import NodeEnvironment from 'jest-environment-node'
import puppeteer from 'puppeteer'
import ipc from 'node-ipc'
import {isEqual} from 'lodash'
import {EditorSelection, PortableTextBlock} from '../../src'

ipc.config.id = 'collaborative-jest-environment-ipc-client'
ipc.config.retry = 1500
ipc.config.silent = true

const WEB_SERVER_ROOT_URL = 'http://localhost:3000'

const SELECTION_EVENT_DELAY_MS = 50

// Forward debug info from the PTE in the browsers
// const DEBUG = 'sanity-pte:*'
const DEBUG = false

let testId: string

export const delay = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
export default class CollaborationEnvironment extends NodeEnvironment {
  private _browserA: puppeteer.Browser
  private _browserB: puppeteer.Browser
  private _pageA: puppeteer.Page
  private _pageB: puppeteer.Page
  public async setup(): Promise<void> {
    await super.setup()
    this._browserA = await puppeteer.launch()
    this._browserB = await puppeteer.launch()
    this._pageA = await this._browserA.newPage()
    this._pageB = await this._browserB.newPage()

    // Hook up page console and npm debug in the PTE
    if (DEBUG) {
      await this._pageA.evaluateOnNewDocument((filter) => {
        window.localStorage.debug = filter
      }, DEBUG)
      await this._pageB.evaluateOnNewDocument((filter) => {
        window.localStorage.debug = filter
      }, DEBUG)
      this._pageA.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`A:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`)
      )
      this._pageB.on('console', (message) =>
        // eslint-disable-next-line no-console
        console.log(`B:${message.type().substring(0, 3).toUpperCase()} ${message.text()}`)
      )
    }
    this._pageA.on('pageerror', (err) => {
      console.error('Editor A crashed', err)
    })
    this._pageB.on('pageerror', (err) => {
      console.error('Editor B crashed', err)
    })
    await new Promise<void>((resolve) => {
      ipc.connectToNet('socketServer', () => {
        resolve()
      })
    })
  }

  public async handleTestEvent(event: {name: string}): Promise<void> {
    if (event.name === 'test_start') {
      await this._setupInstance()
    }
  }

  public async teardown(): Promise<void> {
    await super.teardown()
    this._browserA.close()
    this._browserB.close()
    ipc.disconnect('socketServer')
  }

  private async _setupInstance(): Promise<void> {
    testId = (Math.random() + 1).toString(36).substring(7)
    await this._pageA.goto(`${WEB_SERVER_ROOT_URL}?editorId=A&testId=${testId}`)
    await this._pageB.goto(`${WEB_SERVER_ROOT_URL}?editorId=B&testId=${testId}`)
    this.global.setDocumentValue = async (
      value: PortableTextBlock[] | undefined
    ): Promise<void> => {
      ipc.of.socketServer.emit('payload', JSON.stringify({type: 'value', value, testId}))
      const valueHandleA: puppeteer.ElementHandle<HTMLDivElement> = await this._pageA.waitForSelector(
        '#pte-value'
      )
      const valueHandleB: puppeteer.ElementHandle<HTMLDivElement> = await this._pageB.waitForSelector(
        '#pte-value'
      )
      const readVal = (node) => {
        return node.innerText ? JSON.parse(node.innerText) : undefined
      }
      const valueA: PortableTextBlock[] | undefined = await valueHandleA.evaluate(readVal)
      const valueB: PortableTextBlock[] | undefined = await valueHandleB.evaluate(readVal)
      return new Promise<void>((resolve, reject) => {
        if (isEqual(value, valueA) && isEqual(value, valueB)) {
          return resolve()
        }
        return reject(new Error('Could not propagate value to browsers'))
      })
    }
    this.global.getEditors = () =>
      Promise.all(
        [this._pageA, this._pageB].map(async (page, index) => {
          const editorId = ['A', 'B'][index]
          const editableHandle = await page.waitForSelector('div[contentEditable="true"]')
          const waitForRevision = async () => {
            const revId = (Math.random() + 1).toString(36).substring(7)
            ipc.of.socketServer.emit('payload', JSON.stringify({type: 'revId', revId, testId}))
            await page.waitForSelector(`code[data-rev-id="${revId}"]`)
          }
          return {
            testId,
            editorId,
            insertText: async (text: string) => {
              await editableHandle.evaluate(
                (node, args) => {
                  node.dispatchEvent(
                    new InputEvent('beforeinput', {
                      bubbles: true,
                      cancelable: true,
                      inputType: 'insertText',
                      data: args[0],
                    })
                  )
                },
                [text]
              )
              await waitForRevision()
            },
            insertNewLine: async () => {
              await editableHandle.press('Enter')
              await waitForRevision()
            },
            pressKey: async (keyName: string, times?: number) => {
              for (let i = 0; i < (times || 1); i++) {
                await editableHandle.press(keyName)
              }
              if (keyName.length === 1 || keyName === 'Backspace' || keyName === 'Delete') {
                await waitForRevision()
              } else {
                await delay(SELECTION_EVENT_DELAY_MS)
              }
            },
            focus: async () => {
              await editableHandle.focus()
            },
            setSelection: async (selection: EditorSelection | null) => {
              await editableHandle.focus()
              ipc.of.socketServer.emit(
                'payload',
                JSON.stringify({
                  type: 'selection',
                  selection,
                  testId,
                  editorId,
                })
              )
              await delay(SELECTION_EVENT_DELAY_MS)
            },
            async getValue(): Promise<PortableTextBlock[] | undefined> {
              const valueHandle: puppeteer.ElementHandle<HTMLDivElement> = await page.waitForSelector(
                '#pte-value'
              )
              const value = await valueHandle.evaluate((node): PortableTextBlock[] | undefined =>
                node.innerText ? JSON.parse(node.innerText) : undefined
              )
              return value
            },
            async getSelection(): Promise<EditorSelection | null> {
              const selectionHandle: puppeteer.ElementHandle<HTMLDivElement> = await page.waitForSelector(
                '#pte-selection'
              )
              const selection = await selectionHandle.evaluate((node) =>
                node.innerText ? JSON.parse(node.innerText) : null
              )
              return selection
            },
          }
        })
      )
  }
}
