import NodeEnvironment from 'jest-environment-node'
import puppeteer from 'puppeteer'
import ipc from 'node-ipc'
import {isEqual} from 'lodash'
import {EditorSelection, PortableTextBlock} from '../../src'

ipc.config.id = 'portable-text-editor-test-environment'
ipc.config.retry = 1500
ipc.config.silent = true

const SERVER_URL = 'http://localhost:3000'

const REFRESH_MS = 500

// const DEBUG = 'sanity-pte:plugin:withPatches'
const DEBUG = false

let testSuiteId: string

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
  async setup(): Promise<void> {
    await new Promise<void>(async (resolve) => {
      this._browserA = await puppeteer.launch()
      this._pageA = await this._browserA.newPage()
      this._browserB = await puppeteer.launch()
      this._pageB = await this._browserB.newPage()
      if (DEBUG) {
        await this._pageA.evaluateOnNewDocument((filter) => {
          window.localStorage.debug = filter
        }, DEBUG)
        await this._pageB.evaluateOnNewDocument((filter) => {
          window.localStorage.debug = filter
        }, DEBUG)
        this._pageA.on('console', (message) =>
          // eslint-disable-next-line no-console
          console.log(`A:${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
        )
        this._pageB.on('console', (message) =>
          // eslint-disable-next-line no-console
          console.log(`B:${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
        )
      }
      testSuiteId = (Math.random() + 1).toString(36).substring(7)
      await this._pageA.goto(`${SERVER_URL}?editorId=A&testSuiteId=${testSuiteId}`)
      await this._pageB.goto(`${SERVER_URL}?editorId=B&testSuiteId=${testSuiteId}`)
      ipc.connectToNet('socketServer', () => {
        resolve()
      })
    })
    this.global.setDocumentValue = async (
      value: PortableTextBlock[] | undefined
    ): Promise<void> => {
      ipc.of.socketServer.emit('ws-payload', JSON.stringify({type: 'value', value, testSuiteId}))
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
        [this._pageA, this._pageB].map((page) => {
          return {
            insertText: async (text: string) => {
              const editableHandle = await page.waitForSelector('div[contentEditable="true"]')
              await editableHandle.click()
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
              // Give value time to propagate through websockets
              // TODO: could this be awaited more precisely? One idea would be to use revisionIds and test for those in DOM.
              await delay(REFRESH_MS)
            },
            insertNewLine: async () => {
              const editableHandle = await page.waitForSelector('div[contentEditable="true"]')
              await editableHandle.press('Enter')
              await delay(REFRESH_MS)
            },
            pressKey: async (keyName: string, times?: number) => {
              const editableHandle = await page.waitForSelector('div[contentEditable="true"]')
              for (let i = 0; i < (times || 1); i++) {
                await editableHandle.press(keyName)
                await delay(300)
              }
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
    await super.setup()
  }

  async teardown(): Promise<void> {
    ipc.disconnect('socketServer')
    await this._browserA.close()
    await this._browserB.close()
    await super.teardown()
  }
}
