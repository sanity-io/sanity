import {describe, expect, it} from 'vitest'

import {extractDroppedFiles} from './extractFiles'

function createFile(name: string): File {
  return new File(['content'], name, {type: 'text/plain'})
}

/**
 * Builds a DataTransfer-like object whose file only surfaces through `items`
 * (with `webkitGetAsEntry()` returning null), mirroring how Firefox exposes a
 * programmatically constructed DataTransfer.
 */
function createItemsOnlyDataTransfer(file: File): DataTransfer {
  const item = {
    kind: 'file' as const,
    type: file.type,
    getAsFile: () => file,
    webkitGetAsEntry: () => null,
  } as unknown as DataTransferItem

  return {
    files: [] as unknown as FileList,
    items: [item] as unknown as DataTransferItemList,
  } as unknown as DataTransfer
}

describe('extractDroppedFiles', () => {
  it('reads files from `dataTransfer.files` when available', async () => {
    const file = createFile('a.txt')
    const dataTransfer = {
      files: [file] as unknown as FileList,
      items: [] as unknown as DataTransferItemList,
    } as unknown as DataTransfer

    await expect(extractDroppedFiles(dataTransfer)).resolves.toEqual([file])
  })

  it('falls back to `getAsFile()` when `webkitGetAsEntry()` returns null', async () => {
    const file = createFile('capybara.jpg')

    await expect(extractDroppedFiles(createItemsOnlyDataTransfer(file))).resolves.toEqual([file])
  })
})
