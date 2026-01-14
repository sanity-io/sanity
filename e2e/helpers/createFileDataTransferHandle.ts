import {type JSHandle, type Page} from '@playwright/test'

interface Context {
  page: Page
}

interface Options {
  buffer: Buffer
  fileName: string
  fileOptions: FilePropertyBag
}

/**
 * Create a `DataTransfer` handle containing the provided buffer.
 *
 * @internal
 **/
export function createFileDataTransferHandle(
  {page}: Context,
  options: Options,
): Promise<JSHandle<DataTransfer>> {
  return page.evaluateHandle(
    ({fileData, fileName, fileOptions}) => {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(new File([new Uint8Array(fileData)], fileName, fileOptions))
      return dataTransfer
    },
    {
      ...options,
      fileData: options.buffer.toJSON().data,
    },
  )
}
