// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unassigned-import
import 'blob-polyfill'

export interface ClipboardItemJest extends ClipboardItem {
  presentationStyle: 'unspecified' | 'inline' | 'attachment'
}

class Clipboard {
  private clipboardItems: ClipboardItem[] = []

  async write(data: ClipboardItems): Promise<void> {
    for (const clipboardItem of data) {
      // eslint-disable-next-line guard-for-in, @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      for (const type in clipboardItem) {
        this.clipboardItems = [clipboardItem]
      }
    }

    return Promise.resolve()
  }

  async writeText(text: string): Promise<string> {
    const clipboardItem: ClipboardItemJest = {
      presentationStyle: 'inline',
      types: ['text/plain'],
      getType(type: string): Promise<Blob> {
        return new Promise((resolve) => {
          resolve(new Blob([text], {type: 'text/plain'}))
        })
      },
    }
    this.clipboardItems = [clipboardItem]

    return text
  }

  async read(): Promise<ClipboardItem[]> {
    return Promise.resolve(this.clipboardItems)
  }

  async readText(): Promise<string> {
    if (this.clipboardItems.length === 0) {
      return Promise.resolve('')
    }

    const blob = await this.clipboardItems[0].getType('text/plain')
    return blob.text()
  }
}

const clipboard: Clipboard = new Clipboard()

export function setupClipboard(): void {
  Object.assign(global.navigator, {
    clipboard,
  })
}

export function tearDownClipboard(): void {
  Object.assign(global.navigator, {
    clipboard: null,
  })
}

export const writeTextToClipboard = async (writeToClipboard: string): Promise<void> => {
  await navigator.clipboard.writeText(writeToClipboard)
  await clipboard.writeText(writeToClipboard)
}

export const writeToClipboard = async (text: string): Promise<void> => {
  const a: ClipboardItemJest = {
    presentationStyle: 'inline',
    types: ['text/plain'],
    getType(type: string): Promise<Blob> {
      const myBlob = new Blob([text], {type: 'text/plain'})
      return Promise.resolve(myBlob)
    },
  }

  const data: ClipboardItems = [a]

  await clipboard.write(data)

  return navigator.clipboard.write(data)
}

export const writeItemsToClipboard = async (items: ClipboardItems): Promise<void> => {
  await clipboard.write(items)
  return navigator.clipboard.write(items)
}

export const readFromClipboard = async (): Promise<ClipboardItems> => {
  await navigator.clipboard.read()
  return clipboard.read()
}

export const readTextFromClipboard = async (): Promise<string> => {
  await navigator.clipboard.readText()
  return clipboard.readText()
}
